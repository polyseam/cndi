import { CNDIConfig, TFBlocks } from "src/types.ts";

import {
  App,
  CDKTFProviderGCP,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformOutput,
} from "cdktf-deps";

import {
  ARGOCD_HELM_VERSION,
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  SEALED_SECRETS_VERSION,
} from "consts";

import {
  getCDKTFAppConfig,
  getTaintEffectForDistribution,
  patchAndStageTerraformFilesWithInput,
  useSshRepoAuth,
} from "src/utils.ts";

import GCPCoreTerraformStack from "./GCPCoreStack.ts";

function truncateString(str: string, num = 63) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num);
}

// TODO: ensure that splicing project_name into tags.Name is safe
export default class GCPGKETerraformStack extends GCPCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const project_name = this.locals.cndi_project_name.asString;
    const project_id = this.locals.gcp_project_id.asString;
    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_tls_provider", {});

    const clientConfig = new CDKTFProviderGCP.dataGoogleClientConfig
      .DataGoogleClientConfig(
      this,
      "cndi_google_client_config",
      {},
    );

    const projectServiceCloudResourseManager = new CDKTFProviderGCP
      .projectService.ProjectService(
      this,
      "cndi_google_project_service_cloudresourcemanager",
      {
        disableOnDestroy: false,
        service: "cloudresourcemanager.googleapis.com",
      },
    );

    const projectServiceCompute = new CDKTFProviderGCP.projectService
      .ProjectService(
      this,
      "cndi_google_project_service_compute",
      {
        disableOnDestroy: false,
        service: "compute.googleapis.com",
        dependsOn: [projectServiceCloudResourseManager],
      },
    );

    const projectServiceFile = new CDKTFProviderGCP.projectService
      .ProjectService(
      this,
      "cndi_google_project_service_file",
      {
        disableOnDestroy: false,
        service: "file.googleapis.com",
        dependsOn: [projectServiceCloudResourseManager],
      },
    );

    const projectServiceContainer = new CDKTFProviderGCP.projectService
      .ProjectService(
      this,
      "cndi_google_project_service_container",
      {
        disableOnDestroy: false,
        service: "container.googleapis.com",
        dependsOn: [projectServiceCloudResourseManager],
      },
    );

    const projectServicesReady = new CDKTFProviderTime.sleep.Sleep(
      this,
      "cndi_time_sleep_services_ready",
      {
        createDuration: "60s",
        dependsOn: [
          projectServiceCloudResourseManager,
          projectServiceCompute,
          projectServiceContainer,
          projectServiceFile,
        ],
      },
    );

    const network = new CDKTFProviderGCP.computeNetwork.ComputeNetwork(
      this,
      "cndi_google_compute_network",
      {
        name: truncateString(`cndi-compute-network-${project_name}`),
        autoCreateSubnetworks: false,
        dependsOn: [projectServicesReady],
      },
    );

    const subnet = new CDKTFProviderGCP.computeSubnetwork.ComputeSubnetwork(
      this,
      "cndi_google_compute_subnetwork",
      {
        name: truncateString(`cndi-compute-subnetwork-${project_name}`),
        ipCidrRange: "10.0.0.0/16",
        network: network.selfLink,
        privateIpGoogleAccess: true,
        dependsOn: [network],
      },
    );

    const _computeFirewallInternal = new CDKTFProviderGCP.computeFirewall
      .ComputeFirewall(
      this,
      "cndi_google_compute_firewall",
      {
        name: truncateString(
          `cndi-compute-firewall-allow-internal-${project_name}`,
        ),
        description: "Allow internal traffic inside cluster",
        network: network.selfLink,
        direction: "INGRESS",
        dependsOn: [projectServicesReady],
        allow: [
          {
            protocol: "icmp",
          },
          {
            protocol: "tcp",
            ports: ["0-65535"],
          },
          {
            protocol: "udp",
            ports: ["0-65535"],
          },
        ],
        sourceRanges: [
          subnet.ipCidrRange,
        ],
      },
    );

    const gkeCluster = new CDKTFProviderGCP.containerCluster.ContainerCluster(
      this,
      "cndi_google_container_cluster",
      {
        name: project_name,
        location: this.locals.gcp_region.asString,
        nodeLocations: [this.locals.gcp_zone.asString],
        // https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/container_cluster#example-usage---with-a-separately-managed-node-pool-recommended
        // "We can't create a cluster with no node pool defined, but we want to only use
        // separately managed node pools. So we create the smallest possible default
        // node pool and immediately delete it."
        removeDefaultNodePool: true,
        initialNodeCount: 1, // ^
        project: this.locals.gcp_project_id.asString,
        dependsOn: [projectServicesReady, subnet, network],
        network: network.selfLink,
        subnetwork: subnet.selfLink,
        deletionProtection: false,
        addonsConfig: {
          gcpFilestoreCsiDriverConfig: {
            enabled: true,
          },
          gcePersistentDiskCsiDriverConfig: {
            enabled: true,
          },
          gcsFuseCsiDriverConfig: {
            enabled: false,
          },
        },
      },
    );

    const kubernetes = {
      host: `https://${gkeCluster.endpoint}`,
      token: clientConfig.accessToken,
      clusterCaCertificate: Fn.base64decode(
        gkeCluster.masterAuth.clusterCaCertificate,
      ),
    };

    new CDKTFProviderKubernetes.provider.KubernetesProvider(
      this,
      "cndi_kubernetes_provider",
      kubernetes,
    );

    let nodePoolIndex = 0;
    for (const nodePoolSpec of cndi_config.infrastructure.cndi.nodes) {
      const nodeCount = nodePoolSpec.count || 1;

      const diskSizeGb = nodePoolSpec?.disk_size_gb ||
        nodePoolSpec?.disk_size ||
        nodePoolSpec?.volume_size ||
        DEFAULT_NODE_DISK_SIZE_MANAGED;

      const diskType = nodePoolSpec?.disk_type || "pd-ssd";

      const serviceAccount = this.locals.gcp_client_email.asString;

      const machineType = nodePoolSpec?.machine_type ||
        nodePoolSpec?.instance_type ||
        DEFAULT_INSTANCE_TYPES.gcp;

      const taint = nodePoolSpec?.taints?.map((taint) => ({
        key: taint.key,
        value: taint.value,
        effect: getTaintEffectForDistribution(taint.effect, "gke"), // taint.effect must be valid by now
      })) || [];

      const labels = nodePoolSpec.labels || {};

      const nodeConfig = {
        diskSizeGb,
        diskType,
        labels,
        taint,
        serviceAccount,
        machineType,
      };

      if (
        Object.hasOwn(nodePoolSpec, "min_count") ||
        Object.hasOwn(nodePoolSpec, "max_count")
      ) {
        new CDKTFProviderGCP.containerNodePool.ContainerNodePool(
          this,
          `cndi_gcp_container_node_pool_${nodePoolSpec.name}`,
          {
            cluster: gkeCluster.name,
            name: nodePoolSpec.name,
            nodeConfig,
            autoscaling: {
              minNodeCount: nodePoolSpec?.min_count ?? nodeCount,
              maxNodeCount: nodePoolSpec?.max_count ?? nodeCount,
              locationPolicy: "BALANCED",
            },
            initialNodeCount: nodeCount ?? nodePoolSpec.min_count,
          },
        );
      } else {
        new CDKTFProviderGCP.containerNodePool.ContainerNodePool(
          this,
          `cndi_google_container_node_pool_${nodePoolIndex}`,
          {
            cluster: gkeCluster.name,
            name: nodePoolSpec.name,
            nodeConfig,
            nodeCount,
          },
        );
      }
      nodePoolIndex++;
    }

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
        dependsOn: [gkeCluster],
        timeout: 600,
        atomic: true,
        name: "argocd",
        namespace: "argocd",
        replace: true,
        repository: "https://argoproj.github.io/argo-helm",
        version: ARGOCD_HELM_VERSION,
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
        dependsOn: [gkeCluster],
      },
    );

    const _helmReleaseSealedSecrets = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_sealed_secrets",
      {
        chart: "sealed-secrets",
        dependsOn: [gkeCluster, sealedSecretsSecret],
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
          finalizers: ["resources-finalizer.argocd.argoproj.io/background"],
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

    new CDKTFProviderKubernetes.storageClass.StorageClass(
      this,
      "cndi_kubernetes_storage_class_pd",
      {
        metadata: {
          name: "rwo",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true",
          },
        },
        parameters: {
          type: "pd-balanced",
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        storageProvisioner: "pd.csi.storage.gke.io",
        volumeBindingMode: "WaitForFirstConsumer",
        dependsOn: [gkeCluster],
      },
    );
    new CDKTFProviderKubernetes.storageClass.StorageClass(
      this,
      "cndi_kubernetes_storage_class_filestore",
      {
        metadata: {
          name: "rwm",
        },
        parameters: {
          network: network.name,
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        storageProvisioner: "filestore.csi.storage.gke.io",
        volumeBindingMode: "WaitForFirstConsumer",
        dependsOn: [gkeCluster],
      },
    );
    new TerraformOutput(this, "resource_group_url", {
      value: `https://console.cloud.google.com/welcome?project=${project_id}`,
    });

    new TerraformOutput(this, "get_kubeconfig_command", {
      value:
        `gcloud container clusters get-credentials ${project_name} --region ${this.locals.gcp_region.asString} --project ${project_id}`,
    });
  }
}

export async function stageTerraformSynthGCPGKE(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new GCPGKETerraformStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}
