import { CNDIConfig } from "../../../types.ts";

import {
  App,
  ccolors,
  CDKTFProviderAzure,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  Fn,
  TerraformOutput,
  TerraformVariable,
} from "../../../deps.ts";

import {
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  RELOADER_VERSION,
  SEALED_SECRETS_VERSION,
} from "../../../constants.ts";

import {
  getCDKTFAppConfig,
  resolveCNDIPorts,
  stageCDKTFStack,
  useSshRepoAuth,
} from "../../../utils.ts";

import AzureCoreTerraformStack from "./AzureCoreStack.ts";

function isValidAzureAKSNodePoolName(inputString: string): boolean {
  if (inputString.match(/^[0-9a-z]+$/) && inputString.length <= 12) {
    return true;
  }
  return false;
}

type AnonymousClusterNodePoolConfig = Omit<
  CDKTFProviderAzure.kubernetesClusterNodePool.KubernetesClusterNodePoolConfig,
  "kubernetesClusterId"
>;

// TODO: ensure that splicing project_name into tags.Name is safe
export default class AzureAKSTerraformStack extends AzureCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_provider_time", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_provider_tls", {});

    const project_name = this.locals.cndi_project_name.asString;
    const _open_ports = resolveCNDIPorts(cndi_config);

    const nodePools: Array<AnonymousClusterNodePoolConfig> = cndi_config
      .infrastructure.cndi.nodes.map((nodeSpec) => {
        if (!isValidAzureAKSNodePoolName(nodeSpec.name)) {
          console.log(
            ccolors.error(
              `ERROR: invalid node pool name '${
                ccolors.user_input(nodeSpec.name)
              }'`,
            ),
          );
          console.log(
            "node pool names must be at most 12 characters long and only contain lowercase alphanumeric characters",
          );
          Deno.exit(11); // TODO: proper error code
        }
        const count = nodeSpec.count || 1;

        const scale = {
          nodeCount: count,
          maxCount: count,
          minCount: count,
        };

        if (nodeSpec.max_count) {
          scale.maxCount = nodeSpec.max_count;
        }

        if (nodeSpec.min_count) {
          scale.minCount = nodeSpec.min_count;
        }

        const nodePoolSpec: AnonymousClusterNodePoolConfig = {
          name: nodeSpec.name,
          ...scale,
          vmSize: nodeSpec.instance_type || DEFAULT_INSTANCE_TYPES.azure,
          osDiskSizeGb: nodeSpec.disk_size || DEFAULT_NODE_DISK_SIZE_MANAGED,
          osSku: "Ubuntu",
          osDiskType: "Managed",
          enableAutoScaling: true,
          maxPods: 110,
        };
        return nodePoolSpec;
      });

    const defaultNodePool = nodePools.shift()!; // first nodePoolSpec

    this.variables.arm_client_id = new TerraformVariable(
      this,
      "arm_client_id",
      {
        type: "string",
        description: "The client id for the service principal",
      },
    );

    this.variables.arm_client_secret = new TerraformVariable(
      this,
      "arm_client_secret",
      {
        type: "string",
        description: "The client secret for the service principal",
      },
    );

    const cluster = new CDKTFProviderAzure.kubernetesCluster.KubernetesCluster(
      this,
      `cndi_azurerm_kubernetes_cluster`,
      {
        location: this.locals.arm_region.asString,
        name: `cndi-aks-cluster-${project_name}`,
        kubernetesVersion: "1.27",
        resourceGroupName: this.rg.name,
        defaultNodePool: {
          ...defaultNodePool,
          temporaryNameForRotation: "temp0",
          type: "VirtualMachineScaleSets",
        },
        tags: {
          CNDIProject: project_name,
        },
        skuTier: "Free",
        dnsPrefix: `cndi-aks-${project_name}`,
        networkProfile: {
          loadBalancerSku: "standard",
          networkPlugin: "azure",
          networkPolicy: "azure",
        },
        roleBasedAccessControlEnabled: false, // Tamika
        storageProfile: {
          fileDriverEnabled: true,
          diskDriverEnabled: true,
          blobDriverEnabled: false,
        },
        servicePrincipal: {
          clientId: this.variables.arm_client_id.value,
          clientSecret: this.variables.arm_client_secret.value,
        },
        nodeResourceGroup: `${this.rg.name}-resources`,
        dependsOn: [this.rg],
      },
    );

    const kubernetes = {
      clusterCaCertificate: Fn.base64decode(
        cluster.kubeConfig.get(0).clusterCaCertificate,
      ),
      host: cluster.kubeConfig.get(0).host,
      clientKey: Fn.base64decode(cluster.kubeConfig.get(0).clientKey),
      clientCertificate: Fn.base64decode(
        cluster.kubeConfig.get(0).clientCertificate,
      ),
      loadConfigFile: false,
    };

    new CDKTFProviderKubernetes.provider.KubernetesProvider(
      this,
      "cndi_provider_kubernetes",
      kubernetes,
    );

    new CDKTFProviderHelm.provider.HelmProvider(this, "cndi_provider_helm", {
      kubernetes,
    });

    let nodePoolIndex = 1; // 0 is the default nodePoolSpec
    for (const nodeSpec of nodePools) {
      // all non-default nodePoolSpecs
      new CDKTFProviderAzure.kubernetesClusterNodePool
        .KubernetesClusterNodePool(
        this,
        `cndi_azurerm_kubernetes_cluster_node_pool_${nodePoolIndex}`,
        {
          ...nodeSpec,
          kubernetesClusterId: cluster.id,
        },
      );
      nodePoolIndex++;
    }

    new CDKTFProviderKubernetes.storageClass.StorageClass(
      this,
      "cndi_kubernetes_storage_class_azure_file",
      {
        metadata: {
          name: "nfs",
        },
        storageProvisioner: "file.csi.azure.com",
        parameters: {
          skuName: "Premium_LRS",
          protocol: "nfs",
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        volumeBindingMode: "WaitForFirstConsumer",
      },
    );

    new CDKTFProviderKubernetes.storageClass.StorageClass(
      this,
      "cndi_kubernetes_storage_class_azure_disk",
      {
        metadata: {
          name: "cndi-managed-premium-v2-disk",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true",
          },
        },
        storageProvisioner: "disk.csi.azure.com",
        parameters: {
          skuName: "PremiumV2_LRS",
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        volumeBindingMode: "WaitForFirstConsumer",
      },
    );

    const publicIp = new CDKTFProviderAzure.publicIp.PublicIp(
      this,
      "cndi_azurerm_public_ip",
      {
        allocationMethod: "Static",
        location: this.rg.location,
        name: "cndi_azurerm_public_ip_lb",
        resourceGroupName: this.rg.name,
        sku: "Standard",
        tags: { CNDIProject: this.locals.cndi_project_name.asString },
      },
    );

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
            name:
              "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-resource-group",
            value: this.rg.name,
          },
          {
            name: "controller.service.loadBalancerIP",
            value: publicIp.ipAddress,
          },
          {
            name:
              "controller.admissionWebhooks.nodeSelector\\.kubernetes\\.io/os",
            value: "linux",
          },
          {
            name:
              "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path",
            value: "/healthz",
          },
          {
            name:
              "controller.admissionWebhooks.patch.nodeSelector\\.kubernetes\\.io/os",
            value: "linux",
          },
          {
            name: "defaultBackend.nodeSelector\\.beta\\.kubernetes\\.io/os",
            value: "linux",
          },
          {
            name: "controller.ingressClassResource.default",
            value: "false",
          },
          {
            name: "controller.ingressClassResource.controllerValue",
            value: "k8s.io/public-nginx",
          },
          {
            name: "controller.ingressClassResource.enabled",
            value: "true",
          },
          {
            name: "controller.ingressClassResource.name",
            value: "public",
          },
          {
            name: "controller.electionID",
            value: "public-controller-leader",
          },
          {
            name: "controller.extraArgs.tcp-services-configmap",
            value: "ingress-public/ingress-nginx-public-controller",
          },
          {
            name: "rbac.create",
            value: "false",
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
            name:
              "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-internal",
            value: "true",
          },
          {
            name:
              "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path",
            value: "/healthz",
          },
          {
            name:
              "controller.admissionWebhooks.nodeSelector\\.kubernetes\\.io/os",
            value: "linux",
          },
          {
            name:
              "controller.admissionWebhooks.patch.nodeSelector\\.kubernetes\\.io/os",
            value: "linux",
          },
          {
            name: "defaultBackend.nodeSelector\\.beta\\.kubernetes\\.io/os",
            value: "linux",
          },
          {
            name: "controller.ingressClassResource.default",
            value: "false",
          },
          {
            name: "controller.ingressClassResource.controllerValue",
            value: "k8s.io/private-nginx",
          },
          {
            name: "controller.ingressClassResource.enabled",
            value: "true",
          },
          {
            name: "controller.ingressClassResource.name",
            value: "private",
          },
          {
            name: "controller.electionID",
            value: "private-controller-leader",
          },
          {
            name: "controller.extraArgs.tcp-services-configmap",
            value: "ingress-private/ingress-nginx-private-controller",
          },
          {
            name: "rbac.create",
            value: "false",
          },
        ],
        version: "4.8.3",
      },
    );

    const _helmReleaseCertManager = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_cert_manager",
      {
        chart: "cert-manager",
        createNamespace: true,
        dependsOn: [cluster],
        name: "cert-manager",
        namespace: "cert-manager",
        repository: "https://charts.jetstack.io",
        timeout: 600,
        atomic: true,
        set: [
          {
            name: "installCRDs",
            value: "true",
          },
        ],
        version: "1.12.3",
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

    const _helmReleaseReloader = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_reloader",
      {
        chart: "reloader",
        cleanupOnFail: true,
        createNamespace: true,
        dependsOn: [cluster],
        timeout: 600,
        atomic: true,
        name: "reloader",
        namespace: "reloader",
        replace: true,
        repository: "https://stakater.github.io/stakater-charts",
        version: RELOADER_VERSION,
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
      value: publicIp.ipAddress,
    });

    new TerraformOutput(this, "resource_group_url", {
      value:
        `https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${project_name}`,
    });
  }
}

export async function stageTerraformSynthAzureAKS(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AzureAKSTerraformStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
