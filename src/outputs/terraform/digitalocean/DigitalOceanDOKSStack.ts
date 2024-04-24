import { BaseNodeItemSpec, CNDIConfig, TFBlocks } from "src/types.ts";

import { ccolors } from "deps";

import {
  App,
  CDKTFProviderDigitalOcean,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformOutput,
} from "cdktf-deps";

import { DEFAULT_K8S_VERSION, SEALED_SECRETS_VERSION } from "consts";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
  useSshRepoAuth,
} from "src/utils.ts";

import DigitalOceanCoreTerraformStack from "./DigitalOceanCoreStack.ts";

const DOKSStackLabel = ccolors.faded(
  "\nsrc/outputs/terraform/digitalocean/DigitalOceanDOKSStack.ts:",
);

// TODO: ensure that splicing project_name into tags.Name is safe
export default class DigitalOceanDOKSStack
  extends DigitalOceanCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_tls_provider", {});

    const project_name = this.locals.cndi_project_name.asString;

    const clusterName = `cndi-doks-cluster-${project_name}`;

    const kubernetesClusterVersions = new CDKTFProviderDigitalOcean
      .dataDigitaloceanKubernetesVersions.DataDigitaloceanKubernetesVersions(
      this,
      "cndi_k8s_versions",
      {
        versionPrefix: `${DEFAULT_K8S_VERSION}.`,
      },
    );

    const nodeSpecs = cndi_config.infrastructure.cndi.nodes;

    if (!(nodeSpecs.length >= 1)) {
      throw new Error(
        `${DOKSStackLabel} ${
          ccolors.error(
            "no node specs provided in cndi_config.infrastructure.cndi.nodes",
          )
        }`,
      );
    }

    const cluster = new CDKTFProviderDigitalOcean.kubernetesCluster
      .KubernetesCluster(this, "cndi_kubernetes_cluster", {
      name: clusterName,
      version: kubernetesClusterVersions.latestVersion,
      autoUpgrade: true,
      region: this.digitalOceanRegion.slug,
      nodePool: this.getDigitalOceanNodePool(nodeSpecs.shift()!),
    });

    let index = 0;

    for (const node of nodeSpecs) {
      this.getDigitalOceanNodePool(node, cluster, index++);
    }

    const kubernetes = {
      host: cluster.endpoint,
      token: cluster.kubeConfig.get(0).token,
      clusterCaCertificate: Fn.base64decode(
        cluster.kubeConfig.get(0).clusterCaCertificate,
      ),
    };

    new CDKTFProviderKubernetes.provider.KubernetesProvider(
      this,
      "cndi_kubernetes_provider",
      kubernetes,
    );

    new CDKTFProviderHelm.provider.HelmProvider(this, "cndi_helm_provider", {
      kubernetes,
    });

    const _helmReleaseNginxPublic = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_ingress_nginx_controller_public",
      {
        chart: "ingress-nginx",
        createNamespace: true,
        dependsOn: [cluster],
        name: "ingress-nginx-public",
        namespace: "ingress-public",
        repository: "https://kubernetes.github.io/ingress-nginx",
        timeout: 300,
        atomic: true,
        set: [
          {
            name: "controller.publishService.enabled",
            value: "true",
          },
          {
            name: "controller.ingressClassResource.name",
            value: "public",
          },
        ],
        version: "4.8.3",
      },
    );

    const _helmReleaseNginxPrivate = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_ingress_nginx_controller_private",
      {
        chart: "ingress-nginx",
        createNamespace: true,
        dependsOn: [cluster],
        name: "ingress-nginx-private",
        namespace: "ingress-private",
        repository: "https://kubernetes.github.io/ingress-nginx",
        timeout: 300,
        atomic: true,
        set: [
          {
            name: "controller.publishService.enabled",
            value: "true",
          },
          {
            name: "controller.ingressClassResource.name",
            value: "private",
          },
        ],
        version: "4.8.3",
      },
    );

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
        dependsOn: [cluster],
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
        dependsOn: [cluster, sealedSecretsSecret],
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

    new TerraformOutput(this, "public_host", {
      value: "undetermined",
    });

    new TerraformOutput(this, "resource_group_url", {
      value:
        `https://portal.digitalocean.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${project_name}`,
    });

    new TerraformOutput(this, "get_kubeconfig_command", {
      value: `doctl kubernetes cluster kubeconfig save ${clusterName}`,
    });
  }
  getDigitalOceanNodePool(
    nodeSpec: BaseNodeItemSpec,
    cluster?: CDKTFProviderDigitalOcean.kubernetesCluster.KubernetesCluster,
    index?: number,
  ) {
    const clusterId = cluster?.id;

    const tag = `${this.locals.cndi_project_name}-${nodeSpec.name}`;

    if (!clusterId) {
      return {
        name: nodeSpec.name,
        size: nodeSpec.instance_type || nodeSpec.size as string ||
          "s-2vcpu-2gb",
        nodeCount: nodeSpec.count || 1,
        tags: [tag],
      };
    }

    return new CDKTFProviderDigitalOcean.kubernetesNodePool.KubernetesNodePool(
      this,
      `cndi_kubernetes_node_pool_${nodeSpec.name}_${index}`,
      {
        name: `${nodeSpec.name}-${index}`,
        size: nodeSpec.instance_type || nodeSpec.size as string ||
          "s-2vcpu-2gb",
        nodeCount: nodeSpec.count || 1,
        tags: [tag],
        clusterId,
      },
    );
  }
}

export async function stageTerraformSynthDigitalOceanDOKS(
  cndi_config: CNDIConfig,
) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);

  new DigitalOceanDOKSStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}
