import { CNDIConfig, K3dNodeItemSpec } from "src/types.ts";

import {
  App,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformOutput,
} from "cdktf-deps";

const devK3dStackLabel = ccolors.faded(
  "src/outputs/terraform/dev/DevK3dStack.ts:",
);
import { NFS_SERVER_PROVISIONER, SEALED_SECRETS_VERSION } from "consts";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
  useSshRepoAuth,
} from "src/utils.ts";

import { ccolors } from "deps";

import { CNDITerraformStack } from "src/outputs/terraform/CNDICoreTerraformStack.ts";

// TODO: ensure that splicing project_name into tags.Name is safe
export class DevK3dStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const cndi_k3d_cluster = getK3dResource(cndi_config);

    this.addOverride("terraform.required_providers.k3d", {
      source: "pvotal-tech/k3d", // Source of the provider
      version: "0.0.7", // Provider version
    });

    this.addOverride("provider.k3d", {});

    // Define a resource using addOverride
    this.addOverride("resource.k3d_cluster.cndi_k3d_cluster", {
      name: `${cndi_config.project_name}-k3d-cluster`,
      servers: cndi_k3d_cluster.count,
      agents: 0,
      network: `${cndi_config.project_name}-k3d-cluster-network`,
      image: "rancher/k3s:v1.28.8-k3s1",
      kube_api: [{
        "host_ip": "127.0.0.1",
        "host_port": 6443,
      }],

      k3s: [
        {
          extra_args: [
            {
              "arg": "--disable=traefik",
              "node_filters": [
                "server:*",
              ],
            },
          ],
        },
      ],
      port: [
        {
          host: "",
          node_filters: null,
          protocol: "TCP",
          host_port: 80,
          container_port: 80,
        },
        {
          host: "",
          node_filters: null,
          protocol: "TCP",
          host_port: 8080,
          container_port: 8080,
        },
        {
          host: "",
          node_filters: null,
          protocol: "TCP",
          host_port: 443,
          container_port: 443,
        },
      ],
      kubeconfig: [
        {
          "switch_current_context": true,
          "update_default_kubeconfig": true,
        },
      ],
      volume: [{
        source: `${cndi_config.project_name}-k3d-cluster-volumes`,
        destination: "/var/lib/rancher/k3s/storage",
        node_filters: null,
      }],
    });

    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_tls_provider", {});

    const rwoStorageClass = new CDKTFProviderKubernetes.storageClass
      .StorageClass(
      this,
      "cndi_kubernetes_storage_class_local_disk",
      {
        metadata: {
          name: "rwo",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true",
          },
        },
        storageProvisioner: "rancher.io/local-path",
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        volumeBindingMode: "WaitForFirstConsumer",
      },
    );
    this.addOverride(
      "resource.kubernetes_storage_class.cndi_kubernetes_storage_class_local_disk.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );
    const kubernetes = {
      configPath: "~/.kube/config",
    };

    const _kubeProvider = new CDKTFProviderKubernetes.provider
      .KubernetesProvider(
      this,
      "cndi_kubernetes_provider",
      kubernetes,
    );

    new TerraformOutput(this, "cndi_dev_tutorial", {
      value: `
          Accessing ArgoCD UI

          1. Port forward the argocd-server service
          run: kubectl port-forward svc/argocd-server -n argocd 8080:443

          2. Login in the browser
          open: https:127.0.0.1:8080 in your browser to access the argocd UI
      `,
    });

    new CDKTFProviderHelm.provider.HelmProvider(this, "cndi_helm_provider", {
      kubernetes,
    });

    const argocdAdminPasswordHashed = Fn.sensitive(
      Fn.bcrypt(this.variables.argocd_admin_password.value, 10),
    );

    const argocdAdminPasswordMtime = new CDKTFProviderTime.staticResource
      .StaticResource(
      this,
      "cndi_time_static_argocd_admin_password",
      {
        triggers: {
          argocdAdminPassword: Fn.sensitive(
            this.variables.argocd_admin_password.value,
          ),
        },
      },
    );

    const helmReleaseArgoCD = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_argocd",
      {
        chart: "argo-cd",
        cleanupOnFail: true,
        createNamespace: true,
        timeout: 600,
        atomic: true,
        name: "argocd",
        namespace: "argocd",
        replace: true,
        repository: "https://argoproj.github.io/argo-helm",
        version: "5.45.0",
        setSensitive: [
          {
            name: "configs.secret.argocdServerAdminPassword",
            value: Fn.sensitive(argocdAdminPasswordHashed),
          },
        ],
        set: [
          {
            name: "server.service.annotations.redeployTime",
            value: argocdAdminPasswordMtime.id,
          },
          {
            name: "configs.secret.argocdServerAdminPasswordMtime",
            value: argocdAdminPasswordMtime.id,
          },
          {
            name:
              "server.deploymentAnnotations.configmap\\.reloader\\.stakater\\.com/reload",
            value: "argocd-cm",
          },
        ],
      },
    );
    this.addOverride(
      "resource.helm_release.cndi_helm_release_argocd.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );
    if (useSshRepoAuth()) {
      new CDKTFProviderKubernetes.secret.Secret(
        this,
        "cndi_kubernetes_secret_argocd_private_repo",
        {
          dependsOn: [
            helmReleaseArgoCD,
          ],
          metadata: {
            name: "private-repo",
            namespace: "argocd",
            labels: {
              "argocd.argoproj.io/secret-type": "repository",
            },
          },
          data: {
            type: "git",
            url: this.variables.git_repo.value,
            sshPrivateKey: this.variables.git_ssh_private_key.value,
          },
        },
      );
    } else {
      new CDKTFProviderKubernetes.secret.Secret(
        this,
        "cndi_kubernetes_secret_argocd_private_repo",
        {
          dependsOn: [
            helmReleaseArgoCD,
          ],
          metadata: {
            name: "private-repo",
            namespace: "argocd",
            labels: {
              "argocd.argoproj.io/secret-type": "repository",
            },
          },
          data: {
            type: "git",
            password: this.variables.git_token.value, // this makes a reasonable case we should call it git_password as before
            username: this.variables.git_username.value,
            url: this.variables.git_repo.value,
          },
        },
      );
    }

    this.addOverride(
      "resource.kubernetes_secret.cndi_kubernetes_secret_argocd_private_repo.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );

    const sealedSecretsSecret = new CDKTFProviderKubernetes.secret.Secret(
      this,
      "cndi_kubernetes_secret_sealed_secrets_key",
      {
        type: "kubernetes.io/tls",
        metadata: {
          name: "sealed-secrets-key",
          namespace: "kube-system",
          labels: {
            "sealedsecrets.bitnami.com/sealed-secrets-key": "active",
          },
        },

        data: {
          "tls.crt": this.variables.sealed_secrets_public_key.value,
          "tls.key": this.variables.sealed_secrets_private_key.value,
        },
      },
    );
    this.addOverride(
      "resource.kubernetes_secret.cndi_kubernetes_secret_sealed_secrets_key.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );
    const _helmReleaseSealedSecrets = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_sealed_secrets",
      {
        chart: "sealed-secrets",
        dependsOn: [
          sealedSecretsSecret,
        ],
        name: "sealed-secrets",
        namespace: "kube-system",
        repository: "https://bitnami-labs.github.io/sealed-secrets",
        version: SEALED_SECRETS_VERSION,
        timeout: 300,
        atomic: true,
      },
    );
    this.addOverride(
      "resource.helm_release.cndi_helm_release_sealed_secrets.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );
    const _helmReleaseNFSServerProvisioner = new CDKTFProviderHelm.release
      .Release(
      this,
      "cndi_helm_release_nfs_server_provisioner",
      {
        dependsOn: [
          rwoStorageClass,
        ],
        chart: "nfs-server-provisioner",
        name: "nfs-server-provisioner",
        createNamespace: true,
        namespace: "kube-system",
        repository: "https://kvaps.github.io/charts",
        version: NFS_SERVER_PROVISIONER,
        timeout: 300,
        atomic: true,
        set: [
          {
            name: "persistence.enabled",
            value: "true",
          },
          {
            name: "persistence.accessMode",
            value: "ReadWriteOnce",
          },
          {
            name: "persistence.storageClass",
            value: "rwo",
          },
          {
            name: "persistence.storageClass",
            value: "1Gi",
          },
          {
            name: "storageClass.name",
            value: "rwm",
          },
          {
            name: "storageClass.mountOptions[0]",
            value: "vers=4",
          },
        ],
      },
    );
    this.addOverride(
      "resource.helm_release.cndi_helm_release_nfs_server_provisioner.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );
    const argoAppsValues = {
      applications: [
        {
          name: "root-application",
          namespace: "argocd",
          project: "default",
          finalizers: ["resources-finalizer.argocd.argoproj.io"],
          source: {
            repoURL: this.variables.git_repo.value,
            path: "cndi/cluster_manifests",
            targetRevision: "HEAD",
            directory: {
              recurse: true,
            },
          },
          destination: {
            server: "https://kubernetes.default.svc",
            namespace: "argocd",
          },
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
            syncOptions: ["CreateNamespace=true"],
          },
        },
      ],
    };

    new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_argocd_apps",
      {
        chart: "argocd-apps",
        createNamespace: true,
        dependsOn: [
          helmReleaseArgoCD,
        ],
        name: "root-argo-app",
        namespace: "argocd",
        repository: "https://argoproj.github.io/argo-helm",
        version: "1.4.1",
        timeout: 600,
        atomic: true,
        values: [Fn.yamlencode(argoAppsValues)],
      },
    );
    this.addOverride(
      "resource.helm_release.cndi_helm_release_argocd_apps.depends_on",
      [
        "k3d_cluster.cndi_k3d_cluster",
      ],
    );
  }
}

export default function getK3dResource(
  cndi_config: CNDIConfig,
) {
  if (cndi_config.infrastructure.cndi.nodes.length !== 1) {
    throw new Error(
      [
        devK3dStackLabel,
        ccolors.error("dev clusters must have exactly one node group"),
      ].join(" "),
      {
        cause: 4777,
      },
    );
  }
  const node = cndi_config.infrastructure.cndi.nodes[0] as K3dNodeItemSpec;
  const { name } = node;
  const DEFAULT_NODE_COUNT = 1;
  const count = node?.count || DEFAULT_NODE_COUNT;

  return {
    name,
    count,
  };
}
export async function stageTerraformSynthDevK3d(
  cndi_config: CNDIConfig,
) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new DevK3dStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput({
    ...cndi_config?.infrastructure?.terraform,
  });
}
