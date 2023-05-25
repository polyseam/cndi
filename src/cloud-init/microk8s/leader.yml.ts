import { YAML } from "deps";
import { CNDIConfig, Microk8sAddon } from "src/types.ts";
import { DEFAULT_MICROK8S_VERSION, KUBESEAL_VERSION } from "constants";

const defaultAddons: Array<Microk8sAddon> = [
  {
    "name": "dns",
    "args": ["1.1.1.1"],
  },
  {
    "name": "ingress",
  },
  {
    "name": "community",
  },
  {
    "name": "nfs",
  },
  {
    "name": "cert-manager",
  },
];

const getMicrok8sAddons = (config: CNDIConfig): Array<Microk8sAddon> => {
  const addons = defaultAddons;
  const userAddons = config.infrastructure.cndi?.microk8s?.addons;
  if (userAddons) {
    for (const userAddon of userAddons) {
      const index = defaultAddons.findIndex((
        defaultAddon: Microk8sAddon,
      ) => (defaultAddon.name === userAddon.name));

      if (index !== -1) {
        addons[index] = {
          ...defaultAddons[index],
          ...userAddon,
        };
      } else {
        addons.push(userAddon);
      }
    }
  }
  return addons;
};

const clusterRepoSecret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: {
    name: "private-repo",
    namespace: "argocd",
    labels: {
      "argocd.argoproj.io/secret-type": "repository",
    },
  },
  stringData: {
    type: "git",
    password: "\${git_password}",
    username: "\${git_username}",
    url: "\${git_repo}",
  },
};

const rootApplication = {
  apiVersion: "argoproj.io/v1alpha1",
  kind: "Application",
  metadata: {
    name: "root-application", // TODO: name this with "cndi-" prefix ?
    namespace: "argocd",
    finalizers: [
      "resources-finalizer.argocd.argoproj.io", // TODO: wut
    ],
  },
  spec: {
    project: "default",
    destination: {
      namespace: "default",
      server: "https://kubernetes.default.svc",
    },
    source: {
      path: "cndi/cluster_manifests",
      repoURL: "\${git_repo}",
      targetRevision: "HEAD",
      directory: {
        recurse: true,
      },
    },
    syncPolicy: {
      automated: {
        prune: true,
        selfHeal: true,
      },
      syncOptions: [
        "CreateNamespace=false",
      ],
    },
  },
};

const NFS_DEFAULT_STORAGE_PATCH = {
  metadata: {
    annotations: {
      "storageclass.kubernetes.io/is-default-class": "true",
    },
  },
};

const getNFSDefaultStoragePatchYaml = () => {
  return YAML.stringify(NFS_DEFAULT_STORAGE_PATCH);
};

const getClusterRepoSecretYaml = (useSshRepoAuth = false) => { // TODO: provide opt-in for key-based auth
  if (useSshRepoAuth) {
    throw new Error("GIT_SSH_PRIVATE_KEY is not yet supported");
  } else {
    return YAML.stringify(clusterRepoSecret);
  }
};

const getRootApplicationYaml = (config: CNDIConfig) => {
  const userRootApplication = config.infrastructure.cndi?.argocd
    ?.root_application;
  if (userRootApplication) {
    return YAML.stringify({ ...rootApplication, userRootApplication });
  }
  return YAML.stringify(rootApplication);
};

const getLeaderCloudInitYaml = (config: CNDIConfig) => {
  const addons = getMicrok8sAddons(config);
  const microk8sVersion = config.infrastructure.cndi?.microk8s?.version ||
    DEFAULT_MICROK8S_VERSION;
  const microk8sChannel = config.infrastructure.cndi?.microk8s?.channel ||
    "stable";

  const DEFAULT_ARGOCD_INSTALL_URL =
    "https://raw.githubusercontent.com/argoproj/argo-cd/v2.4.22/manifests/install.yaml";

  const userBefore =
    config.infrastructure.cndi?.microk8s?.["cloud-init"]?.leader_before || [];
  const userAfter =
    config.infrastructure.cndi?.microk8s?.["cloud-init"]?.leader_after || [];

  const argocdInstallUrl = config.infrastructure.cndi?.argocd?.install_url ||
    DEFAULT_ARGOCD_INSTALL_URL;

  const microk8sLeaderLaunchConfig = {
    version: "0.1.0",
    persistentClusterToken: "\${bootstrap_token}",
    addons,
    addonRepositories: [
      {
        name: "core",
        url: "https://github.com/canonical/microk8s-core-addons",
      },
      {
        name: "community",
        url: "/snap/microk8s/current/addons/community",
        reference: microk8sVersion,
      },
    ],
  };
  const microk8sLeaderLaunchConfigYaml = YAML.stringify(
    microk8sLeaderLaunchConfig,
  );

  const WORKING_DIR = "/home/ubuntu/.cndi-runtime";
  const PATH_TO_MANIFESTS = `${WORKING_DIR}/manifests`;
  const PATH_TO_LAUNCH_CONFIG = `${WORKING_DIR}/launch-config.yaml`;

  const SEALED_SECRETS_SECRET_NAME = "cndi-sealed-secrets-key";

  const PATH_TO_NFS_DEFAULT_STORAGE_PATCH =
    `${PATH_TO_MANIFESTS}/nfs-default-storage-patch.yaml`;
  const PATH_TO_ROOT_APPLICATION_MANIFEST =
    `${PATH_TO_MANIFESTS}/root-application.yaml`;
  const PATH_TO_CLUSTER_REPO_SECRET_MANIFEST =
    `${PATH_TO_MANIFESTS}/cluster-repo-secret.yaml`;

  const PATH_TO_SEALED_SECRETS_PRIVATE_KEY =
    `${WORKING_DIR}/sealed_secrets_private_key.key`;
  const PATH_TO_SEALED_SECRETS_PUBLIC_KEY =
    `${WORKING_DIR}/sealed_secrets_public_key.crt`;

  // https://cloudinit.readthedocs.io/en/latest/reference/examples.html
  const content = {
    package_update: true,
    package_upgrade: false, // TODO: is package_upgrade:true better?
    packages: [
      "apache2-utils",
      "nfs-common",
    ],
    write_files: [
      {
        path: PATH_TO_LAUNCH_CONFIG,
        content: microk8sLeaderLaunchConfigYaml,
      },
      // TODO: should we keep these files around?
      {
        path: PATH_TO_ROOT_APPLICATION_MANIFEST,
        content: getRootApplicationYaml(config),
      },
      {
        path: PATH_TO_CLUSTER_REPO_SECRET_MANIFEST,
        content: getClusterRepoSecretYaml(),
      },
      {
        path: PATH_TO_NFS_DEFAULT_STORAGE_PATCH,
        content: getNFSDefaultStoragePatchYaml(),
      },
      {
        path: PATH_TO_SEALED_SECRETS_PUBLIC_KEY,
        content: `\${sealed_secrets_public_key}`,
        encoding: "b64",
        permissions: "0644",
      },
      {
        path: PATH_TO_SEALED_SECRETS_PRIVATE_KEY,
        content: `\${sealed_secrets_private_key}`,
        encoding: "b64",
        permissions: "0600",
      },
    ],
    runcmd: [
      `echo "cloud-init.runcmd"`,
      `echo "------------------"`,
      `echo "leader bootstrap initializing!"`,
      `echo "------------------"`,
      `echo "cndi-user-before begin"`,
      ...userBefore,
      `echo "cndi-user-before end"`,
      `echo "------------------"`,
      `echo "cndi-platform begin"`,
      `echo "Installing microk8s"`,
      // the following used to retry every 180 seconds until success:
      `sudo snap install microk8s --classic --channel=${microk8sVersion}/${microk8sChannel}`, // reads /root/snap/microk8s/common/.microk8s.yaml
      `echo "microk8s installed"`,

      `echo "Setting microk8s config"`,
      `sudo snap set microk8s config="$(cat ${PATH_TO_LAUNCH_CONFIG})"`,
      
      // group "microk8s" is created by microk8s snap
      `echo "Adding ubuntu user to microk8s group"`,
      `sudo usermod -a -G microk8s ubuntu`,

      `echo "Granting ubuntu user access to ~/.kube"`,
      `sudo chown -f -R ubuntu ~/.kube`,

      `echo "Waiting for microk8s to be ready"`,
      `sudo microk8s status --wait-ready`,
      `echo "microk8s is ready"`,

      `echo "Installing sealed-secrets-controller"`,
      `sudo microk8s kubectl --namespace kube-system apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/controller.yaml`,
      `echo "sealed-secrets-controller installed"`,

      `echo "Setting NFS as default storage class"`,
      `sudo microk8s kubectl patch storageclass nfs --patch-file ${PATH_TO_NFS_DEFAULT_STORAGE_PATCH}`,
      `echo "NFS is now the default storage class"`,

      `echo "Importing Sealed Secrets Keys"`,
      `sudo microk8s kubectl --namespace "kube-system" create secret tls "${SEALED_SECRETS_SECRET_NAME}" --cert="${PATH_TO_SEALED_SECRETS_PUBLIC_KEY}" --key="${PATH_TO_SEALED_SECRETS_PRIVATE_KEY}"`,
      `sudo microk8s kubectl --namespace "kube-system" label secret "${SEALED_SECRETS_SECRET_NAME}" sealedsecrets.bitnami.com/sealed-secrets-key=active`,
      `echo "Sealed Secrets Keys imported"`,

      `echo "Restarting sealed-secrets-controller"`,
      `sudo microk8s kubectl --namespace kube-system delete pod -l name=sealed-secrets-controller`,

      `echo "Removing Sealed Secrets Keys from disk"`,
      `sudo rm ${PATH_TO_SEALED_SECRETS_PRIVATE_KEY}`,
      `sudo rm ${PATH_TO_SEALED_SECRETS_PUBLIC_KEY}`,
      `echo "Sealed Secrets Keys removed from disk"`,

      `echo "Creating argocd namespace"`,
      `sudo microk8s kubectl create namespace argocd`,
      `echo "ArgoCD namespace created"`,

      `echo "Installing ArgoCD"`,
      `sudo microk8s kubectl apply -n argocd -f ${argocdInstallUrl}`,
      `echo "ArgoCD Installed"`,

      `echo "Configuring ArgoCD Root App Manifest"`,
      `sudo microk8s kubectl apply -n argocd -f ${PATH_TO_ROOT_APPLICATION_MANIFEST}`,
      `echo "ArgoCD Root App Manifest Configured"`,

      `echo "Configuring ArgoCD Cluster Repo Secret"`,
      `sudo microk8s kubectl apply -n argocd -f ${PATH_TO_CLUSTER_REPO_SECRET_MANIFEST}`,
      `echo "ArgoCD Cluster Repo Secret Configured"`,

      `echo "Setting ArgoCD admin password"`,
      `ARGOCD_ADMIN_PASSWORD_HASHED="$(htpasswd \-bnBC 10 "" \${argocd_admin_password} | tr \-d '\:\\n')"`,
      `NOW="$(date +%FT%T%Z)"`,
      `sudo microk8s kubectl -n argocd patch secret argocd-secret -p "{\\"stringData\\"\: {\\"admin.password\\"\:\\"$ARGOCD_ADMIN_PASSWORD_HASHED\\",\\"admin.passwordMtime\\"\: \\"$NOW\\"}}"`,
      `echo "ArgoCD admin password set"`,

      `echo "Cleaning CNDI Runtime Files"`,
      `sudo rm -rf ${WORKING_DIR}`,
      `echo "CNDI Runtime Files Cleaned"`,

      `echo "cndi-platform end"`,
      `echo "------------------"`,
      `echo "cndi-user-after begin"`,
      ...userAfter,
      `echo "cndi-user-after end"`,
      `echo "------------------"`,
      `echo "leader bootstrap complete!"`,
    ],
  };

  const contentYaml = YAML.stringify(content);

  return `#cloud-config\n\n${contentYaml}`;
};

export default getLeaderCloudInitYaml;
