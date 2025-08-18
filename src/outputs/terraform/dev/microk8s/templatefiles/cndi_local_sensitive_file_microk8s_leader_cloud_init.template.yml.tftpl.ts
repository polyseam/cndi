import { Microk8sAddon, NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { YAML } from "deps";

import getClusterRepoSecretSSHTemplate from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_ssh_manifest.yaml.tftpl.ts";
import getClusterRepoSecretHTTPSTemplate from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_https_manifest.yaml.tftpl.ts";
import getRootApplicationTemplate from "src/outputs/terraform/manifest-templates/argocd_root_application_manifest.yaml.tftpl.ts";
import getRwmStorageClassTemplate from "src/outputs/terraform/manifest-templates/rwm_storage_class.yaml.tftpl.ts";
import getRwoStorageClassTemplate from "src/outputs/terraform/manifest-templates/rwo_storage_class.yaml.tftpl.ts";

import { loopUntilSuccess } from "src/outputs/terraform/dev/microk8s/cloud-init-utils.ts";

import {
  ARGOCD_RELEASE_VERSION,
  DEFAULT_K8S_VERSION,
  SEALED_SECRETS_CHART_VERSION,
} from "versions";

const defaultAddons: Array<Microk8sAddon> = [
  {
    name: "dns",
    args: ["1.1.1.1"],
  },
  {
    name: "community",
  },
  {
    name: "helm",
  },
];

const isDevCluster = (config: NormalizedCNDIConfig) => {
  return config.provider === "dev";
};

const getMicrok8sAddons = (
  config: NormalizedCNDIConfig,
): Array<Microk8sAddon> => {
  const addons = defaultAddons;

  if (isDevCluster(config)) {
    addons.push({ name: "hostpath-storage" });
  }

  const userAddons = config.infrastructure.cndi?.microk8s?.addons;
  if (userAddons) {
    for (const userAddon of userAddons) {
      const index = defaultAddons.findIndex(
        (defaultAddon: Microk8sAddon) => defaultAddon.name === userAddon.name,
      );

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

const getClusterRepoSecretYaml = (useSshRepoAuth = false) => {
  // TODO: provide opt-in for key-based auth
  if (useSshRepoAuth) {
    return getClusterRepoSecretSSHTemplate();
  } else {
    return getClusterRepoSecretHTTPSTemplate();
  }
};

type GetLeaderCloudInitYamlOptions = {
  useSshRepoAuth: boolean;
  useClusterHA: boolean;
};

const getLeaderCloudInitYaml = (
  config: NormalizedCNDIConfig,
  { useSshRepoAuth, useClusterHA }: GetLeaderCloudInitYamlOptions,
) => {
  const addons = getMicrok8sAddons(config);
  const microk8sVersion = config.infrastructure.cndi?.microk8s?.version ||
    config?.kubernetes_version || DEFAULT_K8S_VERSION;
  const microk8sChannel = config.infrastructure.cndi?.microk8s?.channel ||
    "stable";

  const DEFAULT_ARGOCD_INSTALL_URL = useClusterHA
    ? `https://raw.githubusercontent.com/argoproj/argo-cd/v${ARGOCD_RELEASE_VERSION}/manifests/ha/install.yaml`
    : `https://raw.githubusercontent.com/argoproj/argo-cd/v${ARGOCD_RELEASE_VERSION}/manifests/install.yaml`;

  const userBefore =
    config.infrastructure.cndi?.microk8s?.["cloud-init"]?.leader_before || [];
  const userAfter =
    config.infrastructure.cndi?.microk8s?.["cloud-init"]?.leader_after || [];

  const argocdInstallUrl = config.infrastructure.cndi?.argocd?.install_url ||
    DEFAULT_ARGOCD_INSTALL_URL;

  const microk8sLeaderLaunchConfig = {
    version: "0.1.0",
    // persistentClusterToken: "\${join_token}", //TODO: figure out how to get this to be reused
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

  const PATH_TO_ROOT_APPLICATION_MANIFEST =
    `${PATH_TO_MANIFESTS}/root-application.yaml`;
  const PATH_TO_CLUSTER_REPO_SECRET_MANIFEST =
    `${PATH_TO_MANIFESTS}/cluster-repo-secret.yaml`;
  const PATH_TO_RWM_STORAGE_CLASS_MANIFEST =
    `${PATH_TO_MANIFESTS}/rwm_storage_class.yaml`;
  const PATH_TO_RWO_STORAGE_CLASS_MANIFEST =
    `${PATH_TO_MANIFESTS}/rwo_storage_class.yaml`;
  const PATH_TO_SEALED_SECRETS_PRIVATE_KEY =
    `${WORKING_DIR}/sealed_secrets_private_key.key`;
  const PATH_TO_SEALED_SECRETS_PUBLIC_KEY =
    `${WORKING_DIR}/sealed_secrets_public_key.crt`;

  const MICROK8S_ADD_NODE_TOKEN_TTL = 4294967295; //seconds 2^32 - 1 (136 Years)

  const packages = ["apache2-utils"];

  const storageClassSetupCommands = [
    `echo "Setting rwo as default storage class"`,
    loopUntilSuccess(
      `sudo microk8s kubectl apply -f ${PATH_TO_RWO_STORAGE_CLASS_MANIFEST}`,
      `microk8s failed to apply rwo storageclass`,
    ),
    `echo "rwo is now the default storage class"`,
    `echo "Setting rwm as default storage class"`,
    loopUntilSuccess(
      `sudo microk8s kubectl apply -f ${PATH_TO_RWM_STORAGE_CLASS_MANIFEST}`,
      `microk8s failed to apply rwm storageclass`,
    ),
    `echo "rwm is now the default storage class"`,
  ];

  // https://cloudinit.readthedocs.io/en/latest/reference/examples.html
  const content = {
    package_update: true,
    package_upgrade: false, // TODO: is package_upgrade:true better?
    packages,
    write_files: [
      {
        path: PATH_TO_LAUNCH_CONFIG,
        content: microk8sLeaderLaunchConfigYaml,
      },
      // TODO: should we keep these files around?
      {
        path: PATH_TO_ROOT_APPLICATION_MANIFEST,
        content: getRootApplicationTemplate(),
      },
      {
        path: PATH_TO_CLUSTER_REPO_SECRET_MANIFEST,
        content: getClusterRepoSecretYaml(useSshRepoAuth),
      },
      {
        path: PATH_TO_RWM_STORAGE_CLASS_MANIFEST,
        content: getRwmStorageClassTemplate(),
      },
      {
        path: PATH_TO_RWO_STORAGE_CLASS_MANIFEST,
        content: getRwoStorageClassTemplate(),
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
      loopUntilSuccess(
        `sudo snap install microk8s --classic --channel=${microk8sVersion}/${microk8sChannel}`,
        `snap failed to install 'microk8s'`,
      ),
      `echo "microk8s installed"`,

      `echo "Setting microk8s config"`,

      `sudo snap set microk8s config="$(cat ${PATH_TO_LAUNCH_CONFIG})"`,
      `sleep 20`,

      // group "microk8s" is created by microk8s snap
      `echo "Adding ubuntu user to microk8s group"`,
      `sudo usermod -a -G microk8s ubuntu`,

      `echo "Granting ubuntu user access to ~/.kube"`,
      `sudo chown -f -R ubuntu ~/.kube`,

      `echo "Waiting for microk8s to be ready"`,
      `sudo microk8s status --wait-ready`,
      `echo "microk8s is ready"`,

      `sudo microk8s add-node --token \${join_token} -l ${MICROK8S_ADD_NODE_TOKEN_TTL}`,

      `echo "Installing sealed-secrets-controller"`,
      loopUntilSuccess(
        `sudo microk8s helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets`,
        "helm failed to add sealed-secrets repo",
      ),
      `sleep 10`,
      loopUntilSuccess(
        `sudo microk8s helm install sealed-secrets-controller sealed-secrets/sealed-secrets --version v${SEALED_SECRETS_CHART_VERSION} --namespace kube-system --set fullnameOverride=sealed-secrets-controller`,
        "helm failed to install sealed-secrets-controller",
      ),
      `echo "sealed-secrets-controller installed"`,

      // storageClass depends on dev cluster or not
      ...storageClassSetupCommands,

      `echo "Importing Sealed Secrets Keys"`,
      loopUntilSuccess(
        `sudo microk8s kubectl --namespace "kube-system" create secret tls "${SEALED_SECRETS_SECRET_NAME}" --cert="${PATH_TO_SEALED_SECRETS_PUBLIC_KEY}" --key="${PATH_TO_SEALED_SECRETS_PRIVATE_KEY}"`,
        "failed to create sealed-secrets-key secret",
      ),
      `sleep 20`,
      loopUntilSuccess(
        `sudo microk8s kubectl --namespace "kube-system" label secret "${SEALED_SECRETS_SECRET_NAME}" sealedsecrets.bitnami.com/sealed-secrets-key=active`,
        "failed to label sealed-secrets-key secret",
      ),
      `echo "Sealed Secrets Keys imported"`,

      `echo "Restarting sealed-secrets-controller"`,
      loopUntilSuccess( // restart sealed-secrets-controller, label set by chart
        `sudo microk8s kubectl --namespace kube-system delete pod -l app.kubernetes.io/name=sealed-secrets`,
        "failed to restart sealed-secrets-controller",
      ),
      `echo "sealed-secrets-controller restarted"`,
      `echo "Removing Sealed Secrets Keys from disk"`,
      `sudo rm ${PATH_TO_SEALED_SECRETS_PRIVATE_KEY}`,
      `sudo rm ${PATH_TO_SEALED_SECRETS_PUBLIC_KEY}`,
      `echo "Sealed Secrets Keys removed from disk"`,

      `echo "Creating argocd namespace"`,
      `sudo microk8s kubectl create namespace argocd`,
      `echo "ArgoCD namespace created"`,

      `echo "Installing ArgoCD"`,
      loopUntilSuccess(
        `sudo microk8s kubectl apply -n argocd -f ${argocdInstallUrl}`,
        `failed to install ArgoCD using manifests: ${argocdInstallUrl}`,
      ),
      `echo "ArgoCD Installed"`,

      `echo "Adding Reloader annotation to argocd-server Deployment"`,
      loopUntilSuccess(
        `sudo microk8s kubectl patch deployment argocd-server -n argocd -p '{"metadata": {"annotations":{"configmap.reloader.stakater.com/reload": "argocd-cm"}}}'`,
        `failed to add Reloader annotation to argocd-server Deployment`,
      ),
      `echo "Reloader annotation added to argocd-server Deployment"`,

      `echo "Configuring ArgoCD Root App Manifest"`,
      `sudo microk8s kubectl apply -n argocd -f ${PATH_TO_ROOT_APPLICATION_MANIFEST}`,
      `echo "ArgoCD Root App Manifest Configured"`,

      `echo "Configuring ArgoCD Cluster Repo Secret"`,
      `sudo microk8s kubectl apply -n argocd -f ${PATH_TO_CLUSTER_REPO_SECRET_MANIFEST}`,
      `echo "ArgoCD Cluster Repo Secret Configured"`,

      `echo "Setting ArgoCD admin password"`,
      // hash password then remove newlines and colons
      `ARGOCD_ADMIN_PASSWORD_HASHED="$(htpasswd \-bnBC 10 \"\" \${argocd_admin_password} | tr \-d '\:\\n')"`,
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
