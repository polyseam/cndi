import { CNDIConfig } from "src/types.ts";

import {
  App,
  // ccolors,
  CDKTFProviderGCP,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  Fn,
  // TerraformOutput,
  // TerraformVariable,
} from "deps";

// import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

import {
  getCDKTFAppConfig,
  // getPrettyJSONString,
  // resolveCNDIPorts,
  stageCDKTFStack,
  useSshRepoAuth,
} from "src/utils.ts";

import GCPCoreTerraformStack from "./GCPCoreStack.ts";

// TODO: ensure that splicing project_name into tags.Name is safe
export default class GCPGKETerraformStack extends GCPCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const project_name = this.locals.cndi_project_name.asString;

    new CDKTFProviderTime.provider.TimeProvider(this, "time", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "tls", {});

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

    const _projectServiceFile = new CDKTFProviderGCP.projectService
      .ProjectService(
      this,
      "cndi_google_project_service_file",
      {
        disableOnDestroy: false,
        service: "file.googleapis.com",
        dependsOn: [projectServiceCloudResourseManager],
      },
    );

    const _projectServiceContainer = new CDKTFProviderGCP.projectService
      .ProjectService(
      this,
      "cndi_google_project_service_file",
      {
        disableOnDestroy: false,
        service: "container.googleapis.com",
        dependsOn: [projectServiceCloudResourseManager],
      },
    );

    const network = new CDKTFProviderGCP.computeNetwork.ComputeNetwork(
      this,
      "cndi_google_compute_network",
      {
        autoCreateSubnetworks: false,
        name: "cndi-compute-network",
        dependsOn: [projectServiceCompute],
      },
    );

    const subnet = new CDKTFProviderGCP.computeSubnetwork.ComputeSubnetwork(
      this,
      "cndi_google_compute_subnetwork",
      {
        name: "cndi-compute-subnetwork",
        ipCidrRange: "10.0.0.0/16",
        network: network.selfLink,
        privateIpGoogleAccess: true,
        secondaryIpRange: [
          {
            ipCidrRange: "10.48.0.0/14",
            rangeName: "cndi-k8s-pod-range",
          },
          {
            ipCidrRange: "10.52.0.0/20",
            rangeName: "cndi-k8s-service-range",
          },
        ],
        dependsOn: [network],
      },
    );

    const _computeFirewallInternal = new CDKTFProviderGCP.computeFirewall
      .ComputeFirewall(
      this,
      "cndi_google_compute_firewall",
      {
        name: "cndi-compute-firewall-allow-internal",
        description: "Allow internal traffic inside cluster",
        network: network.selfLink,
        dependsOn: [projectServiceCompute],
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
          subnet.secondaryIpRange.get(0).ipCidrRange,
          subnet.secondaryIpRange.get(1).ipCidrRange,
        ],
      },
    );

    const gkeCluster = new CDKTFProviderGCP.containerCluster.ContainerCluster(
      this,
      "gke_cluster",
      {
        name: project_name,
        location: this.locals.gcp_region.asString,
        // https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/container_cluster#example-usage---with-a-separately-managed-node-pool-recommended
        // "We can't create a cluster with no node pool defined, but we want to only use
        // separately managed node pools. So we create the smallest possible default
        // node pool and immediately delete it."
        removeDefaultNodePool: true,
        initialNodeCount: 1,
        project: this.locals.gcp_project.asString,
      },
    );

    const kubernetes = {
      clusterCaCertificate: gkeCluster.masterAuth.clusterCaCertificate,
      host: gkeCluster.endpoint,
      token: clientConfig.accessToken,
    };

    new CDKTFProviderKubernetes.provider.KubernetesProvider(
      this,
      "kubernetes",
      kubernetes,
    );

    for (const nodePoolSpec of cndi_config.infrastructure.cndi.nodes) {
      const nodeCount = nodePoolSpec.count || 1;

      const autoscaling = {
        minNodeCount: nodePoolSpec?.min_count || nodeCount,
        maxNodeCount: nodePoolSpec?.max_count || nodeCount,
        locationPolicy: "BALANCED",
      };

      const _nodePool = new CDKTFProviderGCP.containerNodePool
        .ContainerNodePool(
        this,
        "cndi_gcp_container_node_pool",
        {
          cluster: gkeCluster.name,
          nodeCount,
          autoscaling,
          initialNodeCount: nodeCount,
          name: nodePoolSpec.name,
        },
      );
    }

    new CDKTFProviderHelm.provider.HelmProvider(this, "helm", {
      kubernetes,
    });

    const computeAddress = new CDKTFProviderGCP.computeAddress.ComputeAddress(
      this,
      "cndi_google_compute_address",
      {
        name: "cndi-compute-address-lb",
        networkTier: "PREMIUM",
        addressType: "EXTERNAL",
        dependsOn: [projectServiceCompute],
      },
    );

    const argocdAdminPasswordHashed = Fn.sensitive(
      Fn.bcrypt(this.variables.argocd_admin_password.value, 10),
    );

    const argocdAdminPasswordMtime = new CDKTFProviderTime.staticResource
      .StaticResource(
      this,
      "cndi_time_static_admin_password_update",
      {
        triggers: { argocdAdminPassword: argocdAdminPasswordHashed },
      },
    );

    const helmReleaseArgoCD = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_argocd_helm_chart",
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
        version: "5.45.0",
        set: [
          {
            name: "server.service.annotations.redeployTime",
            value: argocdAdminPasswordMtime.id,
          },
          {
            name: "configs.secret.argocdServerAdminPassword",
            value: argocdAdminPasswordHashed,
          },
          {
            name: "configs.secret.argocdServerAdminPasswordMtime",
            value: argocdAdminPasswordMtime.id,
          },
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
        dependsOn: [gkeCluster, sealedSecretsSecret],
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

    const _helmReleaseNginxPublic = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_nginx_controller_helm_chart_public",
      {
        chart: "ingress-nginx",
        createNamespace: true,
        dependsOn: [gkeCluster],
        name: "ingress-nginx-public",
        namespace: "ingress-public",
        repository: "https://kubernetes.github.io/ingress-nginx",
        timeout: 300,
        atomic: true,
        set: [
          {
            name: "controller.service.loadBalancerIP",
            value: computeAddress.address,
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
      "cndi_nginx_controller_helm_chart_private",
      {
        chart: "ingress-nginx",
        createNamespace: true,
        dependsOn: [gkeCluster],
        name: "ingress-nginx-private",
        namespace: "ingress-private",
        repository: "https://kubernetes.github.io/ingress-nginx",
        timeout: 300,
        atomic: true,
        set: [
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
  }
}

export async function stageTerraformSynthGCPGKE(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new GCPGKETerraformStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
