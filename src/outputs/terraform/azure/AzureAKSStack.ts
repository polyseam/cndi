import { CNDIConfig, TFBlocks } from "src/types.ts";

import { ccolors } from "deps";

import {
  App,
  CDKTFProviderAzure,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderRandom,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformLocal,
  TerraformOutput,
  TerraformVariable,
} from "cdktf-deps";

import {
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_K8S_VERSION,
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  SEALED_SECRETS_VERSION,
} from "consts";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
  resolveCNDIPorts,
  useSshRepoAuth,
} from "src/utils.ts";

import AzureCoreTerraformStack from "./AzureCoreStack.ts";

function isValidAzureAKSNodePoolName(inputString: string): boolean {
  if (inputString.match(/^[0-9a-z]+$/) && inputString.length <= 12) {
    return true;
  }
  return false;
}
function aksmapTaintEffect(effect: string): string {
  switch (effect) {
    case "PREFER_NO_SCHEDULE":
      return "PreferNoSchedule";
    case "NO_EXECUTE":
      return "NoExecute";
    case "NO_SCHEDULE":
      return "NoSchedule";
    default:
      return "NoSchedule";
  }
}
type AnonymousClusterNodePoolConfig = Omit<
  CDKTFProviderAzure.kubernetesClusterNodePool.KubernetesClusterNodePoolConfig,
  "kubernetesClusterId"
>;

const DEFAULT_AZURE_NODEPOOL_ZONE = "1";

const AKSStackLabel = ccolors.faded(
  "\nsrc/outputs/terraform/azure/AzureAKSStack.ts:",
);

// TODO: ensure that splicing project_name into tags.Name is safe
export default class AzureAKSTerraformStack extends AzureCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_tls_provider", {});

    const project_name = this.locals.cndi_project_name.asString;
    const _open_ports = resolveCNDIPorts(cndi_config);
    // Generate a random integer within the range 0 to 255.
    // This is used for defining a part of the VNet address space.
    const randomIntegerAddressRange0to255 = new CDKTFProviderRandom.integer
      .Integer(
      this,
      "cndi_random_integer_address_range_0_to_255",
      {
        min: 0,
        max: 255,
      },
    );

    const tags = {
      CNDIProject: project_name,
    };

    // Generate a random integer within the range 0 to 15.
    // This will be used as a base multiplier for the VNet address space calculation.
    const _randomIntegerAddressRange0to15 = new CDKTFProviderRandom.integer
      .Integer(
      this,
      "cndi_random_integer_address_range_0_to_15",
      {
        min: 0,
        max: 15,
      },
    );

    // Calculate a multiplier for the VNet address space by multiplying
    // the random integer (range 0-15) by 16. This local variable will
    // be used in defining subnet address prefixes.
    this.locals.address_space_random_multiplier_16 = new TerraformLocal(
      this,
      "cndi_address_space_random_multiplier_16",
      "${random_integer.cndi_random_integer_address_range_0_to_15.result*16}",
    );

    // Create a virtual network (VNet) in Azure with a dynamic address space.
    // The address space is partially determined by the random integer generated above.
    const vnet = new CDKTFProviderAzure.virtualNetwork.VirtualNetwork(
      this,
      "cndi_azure_vnet",
      {
        name: `cndi-azure-vnet-${project_name}`,
        resourceGroupName: this.rg.name,
        addressSpace: [`10.${randomIntegerAddressRange0to255.id}.0.0/16`],
        location: this.rg.location,
        tags,
      },
    );

    // Create a subnet within the above VNet.
    // The subnet address prefix is dynamically calculated using the address space multiplier.
    const subnet = new CDKTFProviderAzure.subnet.Subnet(
      this,
      "cndi_azure_subnet",
      {
        name: `cndi-azure-subnet-${project_name}`,
        resourceGroupName: this.rg.name,
        virtualNetworkName: vnet.name,
        addressPrefixes: [
          `10.${randomIntegerAddressRange0to255.id}.${this.locals.address_space_random_multiplier_16}.0/20`,
        ],
      },
    );

    const nodePools: Array<AnonymousClusterNodePoolConfig> = cndi_config
      .infrastructure.cndi.nodes.map((nodeSpec) => {
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
        const nodeTaints = nodeSpec.taints?.map((taint) =>
          `${taint.key}=${taint.value}:${aksmapTaintEffect(taint.effect)}`
        ) || [];

        const nodeLabels = nodeSpec.labels || {};

        const nodePoolSpec: AnonymousClusterNodePoolConfig = {
          name: nodeSpec.name,
          ...scale,
          nodeTaints,
          nodeLabels,
          vmSize: nodeSpec.instance_type || DEFAULT_INSTANCE_TYPES.azure,
          osDiskSizeGb: nodeSpec.disk_size || DEFAULT_NODE_DISK_SIZE_MANAGED,
          osSku: "Ubuntu",
          osDiskType: "Managed",
          enableAutoScaling: true,
          maxPods: 110,
          vnetSubnetId: subnet.id,
          tags,
          zones: [DEFAULT_AZURE_NODEPOOL_ZONE],
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
        kubernetesVersion: DEFAULT_K8S_VERSION,
        resourceGroupName: this.rg.name,
        defaultNodePool: {
          ...defaultNodePool,
          temporaryNameForRotation: "temp0",
          type: "VirtualMachineScaleSets",
        },
        tags,
        skuTier: "Free",
        dnsPrefix: `cndi-aks-${project_name}`,
        networkProfile: {
          loadBalancerSku: "standard",
          networkPlugin: "azure",
          networkPolicy: "azure",
        },
        automaticChannelUpgrade: "patch",
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
        nodeResourceGroup: `rg-${project_name}-cluster-resources`,
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
      "cndi_kubernetes_provider",
      kubernetes,
    );

    new CDKTFProviderHelm.provider.HelmProvider(this, "cndi_helm_provider", {
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
          name: "rwo",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true",
          },
        },
        storageProvisioner: "disk.csi.azure.com",
        parameters: {
          skuName: "Standard_LRS",
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        volumeBindingMode: "WaitForFirstConsumer",
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

    new TerraformOutput(this, "resource_group_url", {
      value:
        `https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${project_name}`,
    });

    new TerraformOutput(this, "get_kubeconfig_command", {
      value:
        `az aks get-credentials --resource-group rg-${project_name} --name cndi-aks-cluster-${project_name} --overwrite-existing`,
    });
  }
}

function validateCNDIConfigAzureAKS(cndi_config: CNDIConfig) {
  const nodes = cndi_config?.infrastructure?.cndi?.nodes;
  if (Array.isArray(nodes)) {
    for (const n of nodes) {
      if (!isValidAzureAKSNodePoolName(n.name)) {
        throw new Error(
          [
            AKSStackLabel,
            ccolors.error("Your AKS node name"),
            ccolors.key_name(`"${n.name}"`),
            ccolors.error("is invalid"),
            "\n",
            ccolors.error(
              "AKS Node Pool names must be at most 12 characters long and only contain lowercase alphanumeric characters",
            ),
          ].join(" "),
          {
            cause: 9101,
          },
        );
      }
    }
  }
}

export async function stageTerraformSynthAzureAKS(cndi_config: CNDIConfig) {
  validateCNDIConfigAzureAKS(cndi_config);

  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);

  new AzureAKSTerraformStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}
