import { CNDIConfig, TFBlocks } from "src/types.ts";

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

import { SEALED_SECRETS_VERSION } from "consts";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
  useSshRepoAuth,
} from "src/utils.ts";

import { deepMerge } from "deps";

import { CNDITerraformStack } from "src/outputs/terraform/CNDICoreTerraformStack.ts";

// TODO: ensure that splicing project_name into tags.Name is safe
export default class DevK3dStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const project_name = this.locals.cndi_project_name.asString;

    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_tls_provider", {});
    new CDKTFProviderKubernetes.storageClass.StorageClass(
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
    // this is required because there is no @cdktf/provider-k3d
    const kubernetes = {
      host: "${k3d_cluster.cndi_k3d_cluster.credentials[0].host}",
      clientCertificate:
        "${k3d_cluster.cndi_k3d_cluster.credentials[0].client_certificate}",
      clientKey: "${k3d_cluster.cndi_k3d_cluster.credentials[0].client_key}",
      clusterCaCertificate:
        "${k3d_cluster.cndi_k3d_cluster.credentials[0].cluster_ca_certificate}",
    };

    const _kubeProvider = new CDKTFProviderKubernetes.provider
      .KubernetesProvider(
      this,
      "cndi_kubernetes_provider",
      kubernetes,
    );

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

    if (useSshRepoAuth()) {
      new CDKTFProviderKubernetes.secret.Secret(
        this,
        "cndi_kubernetes_secret_argocd_private_repo",
        {
          dependsOn: [helmReleaseArgoCD],
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
          dependsOn: [helmReleaseArgoCD],
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

    const _helmReleaseSealedSecrets = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_sealed_secrets",
      {
        chart: "sealed-secrets",
        dependsOn: [sealedSecretsSecret],
        name: "sealed-secrets",
        namespace: "kube-system",
        repository: "https://bitnami-labs.github.io/sealed-secrets",
        version: SEALED_SECRETS_VERSION,
        timeout: 300,
        atomic: true,
      },
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
        dependsOn: [helmReleaseArgoCD],
        name: "root-argo-app",
        namespace: "argocd",
        repository: "https://argoproj.github.io/argo-helm",
        version: "1.4.1",
        timeout: 600,
        atomic: true,
        values: [Fn.yamlencode(argoAppsValues)],
      },
    );
  }
}

export async function stageTerraformSynthDevK3d(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new DevK3dStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input = deepMerge({
    resource: {
      k3d_cluster: {
        cndi_k3d_cluster: {
          name: `${cndi_config.project_name || "unnamed"}-k3d-cluster`,
          servers: 1,
          agents: 2,
          image: "rancher/k3s:v1.28.8-k3s1",
          network: "my-cndi-network",
          k3s: [
            {
              extra_args: [
                {
                  "arg": "--disable=traefik",
                  "node_filters": [
                    "server:0",
                  ],
                },
              ],
            },
          ],
          port: [{
            host_port: 8080,
            container_port: 80,
          }, {
            host_port: 443,
            container_port: 443,
          }],
          kubeconfig: [
            {
              "switch_current_context": true,
              "update_default_kubeconfig": true,
            },
          ],
        },
      },
    },
    provider: {
      k3d: {},
    },
    terraform: {
      required_providers: {
        k3d: {
          source: "pvotal-tech/k3d",
          version: "0.0.7",
        },
      },
    },
  }, {
    ...cndi_config?.infrastructure?.terraform,
  });

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}
