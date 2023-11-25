import { CNDIConfig } from "src/types.ts";

import {
  App,
  CDKTFProviderAzure,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  // CDKTFProviderTls,
  Construct,
  Fn,
  TerraformOutput,
  TerraformVariable,
} from "deps";

import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

import {
  getCDKTFAppConfig,
  // getPrettyJSONString,
  resolveCNDIPorts,
  stageCDKTFStack,
  useSshRepoAuth,
} from "src/utils.ts";

import AzureCoreTerraformStack from "./AzureCoreStack.ts";

type AnonymousClusterNodePoolConfig = Omit<
  CDKTFProviderAzure.kubernetesClusterNodePool.KubernetesClusterNodePoolConfig,
  "kubernetesClusterId"
>;

// TODO: ensure that splicing project_name into tags.Name is safe
export default class AzureAKSTerraformStack extends AzureCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const project_name = this.locals.cndi_project_name.asString;
    const _open_ports = resolveCNDIPorts(cndi_config);

    const nodePools: Array<AnonymousClusterNodePoolConfig> = cndi_config
      .infrastructure.cndi.nodes.map((nodeSpec) => {
        const scale = {
          nodeCount: nodeSpec.count,
          maxCount: nodeSpec.count,
          minCount: nodeSpec.count,
        };

        if (nodeSpec.max_count) {
          scale.maxCount = nodeSpec.max_count;
        }

        if (nodeSpec.min_count) {
          scale.minCount = nodeSpec.min_count;
        }

        const nodePoolSpec = {
          name: nodeSpec.name,
          ...scale,
          vmSize: nodeSpec.instance_type || DEFAULT_INSTANCE_TYPES.azure,
          osDiskSizeGb: nodeSpec.disk_size || DEFAULT_NODE_DISK_SIZE_MANAGED,
          osSku: "Ubuntu",
          osDiskType: "Managed",
          type: "VirtualMachineScaleSets",
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
      `cndi_azure_aks_cluster`,
      {
        location: this.locals.arm_region.asString,
        name: `cndi-aks-cluster-${project_name}`,
        kubernetesVersion: "1.27",
        resourceGroupName: this.rg.name,
        defaultNodePool,
        tags: {
          CNDIProject: project_name,
        },
        skuTier: "Free",
        dnsPrefix: `cndi-aks-${project_name}`,
        identity: {
          type: "SystemAssigned",
        },
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

    for (const nodeSpec of nodePools) {
      // all non-default nodePoolSpecs
      new CDKTFProviderAzure.kubernetesClusterNodePool
        .KubernetesClusterNodePool(
        this,
        `cndi_azure_aks_nodepool_${nodeSpec.name}`,
        {
          ...nodeSpec,
          kubernetesClusterId: cluster.id,
        },
      );
    }

    const publicIp = new CDKTFProviderAzure.publicIp.PublicIp(
      this,
      "cndi_azurerm_public_ip_lb",
      {
        allocationMethod: "Static",
        location: this.rg.location,
        name: "cndi_azurerm_public_ip_lb",
        resourceGroupName: this.rg.name,
        sku: "Standard",
        tags: { CNDIProject: this.locals.cndi_project_name.asString },
      },
    );

    const _helmReleaseNginx = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_nginx_controller_helm_chart",
      {
        chart: "ingress-nginx",
        createNamespace: true,
        dependsOn: [cluster, publicIp],
        name: "ingress-nginx",
        namespace: "ingress",
        repository: "https://kubernetes.github.io/ingress-nginx",
        timeout: 600,
        atomic: true,
        set: [
          {
            name:
              "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-resource-group",
            value: "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
          },
          {
            name:
              "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path",
            value: "/healthz",
          },
          {
            name: "controller.service.enabled",
            value: "true",
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
            name: "controller.service.loadBalancerIP",
            value: "${azurerm_public_ip.cndi_azurerm_public_ip_lb.ip_address}",
          },
          {
            name: "controller.ingressClassResource.default",
            value: "true",
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
            name: "controller.ingressClass",
            value: "public",
          },
          {
            name: "controller.extraArgs.tcp-services-configmap",
            value: "ingress/ingress-nginx-controller",
          },
          {
            name: "rbac.create",
            value: "false",
          },
        ],
        version: "4.7.1",
      },
    );

    const _helmReleaseCertManager = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_cert_manager_helm_chart",
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

    const argocdAdminPasswordHashed = Fn.bcrypt(
      this.variables.argocd_admin_password.value,
      10,
    );

    const argocdAdminPasswordMtime = new CDKTFProviderTime.staticResource
      .StaticResource(
      this,
      "cndi_time_static_admin_password_update",
      {
        triggers: { argocdAdminPassword: argocdAdminPasswordHashed },
      },
    );

    const argocdNamespace = new CDKTFProviderKubernetes.namespace.Namespace(
      this,
      "argocd_namespace",
      {
        metadata: {
          name: "argocd",
        },
      },
    );

    const _argocdAdminPasswordSecret = new CDKTFProviderKubernetes.secret
      .Secret(
      this,
      "cndi_argocd_admin_password_secret",
      {
        dependsOn: [argocdNamespace],
        metadata: {
          name: "argocd-secret",
          namespace: "argocd",
        },
        data: {
          // TODO: investigate high chance of this being broken!
          "admin.password": argocdAdminPasswordHashed,
          "admin.passwordMtime": argocdAdminPasswordMtime.id, // this is not exactly what existed before
        },
      },
    );

    const helmReleaseArgoCD = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_argocd_helm_chart",
      {
        chart: "argo-cd",
        cleanupOnFail: true,
        createNamespace: false,
        dependsOn: [cluster, argocdNamespace],
        timeout: 600,
        atomic: true,
        name: "argocd",
        namespace: "argocd",
        replace: true,
        repository: "https://argoproj.github.io/argo-helm",
        version: "5.45.0",
        set: [
          { name: "configs.secret.createSecret", value: "false", type: "auto" },
        ],
      },
    );

    if (useSshRepoAuth()) {
      new CDKTFProviderKubernetes.secret.Secret(
        this,
        "cndi_argocd_private_repo_secret",
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
        "cndi_argocd_private_repo_secret",
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
      "cndi_sealed_secrets_secret",
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
      "cndi_sealed_secrets_helm_chart",
      {
        chart: "sealed-secrets",
        dependsOn: [cluster, sealedSecretsSecret],
        name: "sealed-secrets",
        namespace: "kube-system",
        repository: "https://bitnami-labs.github.io/sealed-secrets",
        version: "2.12.0",
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

    new CDKTFProviderHelm.release.Release(this, "cndi_argocd_apps_root", {
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
    });

    new TerraformOutput(this, "cndi_lb_public_host", {
      value: publicIp.ipAddress,
    });

    new TerraformOutput(this, "cndi_resource_group_url", {
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
