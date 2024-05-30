import { getYAMLString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import { NGINX_VERSION } from "consts";
import { deepMerge } from "deps";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

const getDefaultControllerConfig = () => ({
  electionID: "public-controller-leader",
  ingressClassResource: {
    enabled: "true",
    name: "public",
    default: "false",
    controllerValue: "k8s.io/ingress-nginx-public",
  },
});

const getBaseValues = (cndi_config: CNDIConfig) =>
  deepMerge({
    controller: getDefaultControllerConfig(),
  }, cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public?.values || {});

const eksValues = (cndi_config: CNDIConfig) =>
  deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        annotations: {
          "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
          "service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags":
            cndi_config.project_name,
        },
      },
    },
  });

const gkeValues = (cndi_config: CNDIConfig) => getBaseValues(cndi_config);

const aksValues = (cndi_config: CNDIConfig) =>
  deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        annotations: {
          "service.beta.kubernetes.io/azure-load-balancer-health-probe-request-path":
            "/healthz",
        },
      },
      defaultBackend: {
        "nodeSelector.kubernetes.io/os": "linux",
      },
      admissionWebhooks: {
        patch: {
          "nodeSelector.kubernetes.io/os": "linux",
        },
      },
      rbac: {
        create: "false",
      },
    },
  });

const getDefaultNginxValuesForCNDIProvider = (cndi_config: CNDIConfig) => {
  const cndiDistribution = cndi_config.distribution;
  const providerConfigs = {
    eks: eksValues(cndi_config),
    gke: gkeValues(cndi_config),
    aks: aksValues(cndi_config),
    microk8s: gkeValues(cndi_config), // Not ready
    clusterless: null,
  };

  return providerConfigs[cndiDistribution];
};

export default function getNginxApplicationManifest(
  cndi_config: CNDIConfig,
) {
  if (cndi_config.distribution === "clusterless") return "";
  const releaseName = "ingress-nginx-public";
  const values = getDefaultNginxValuesForCNDIProvider(cndi_config);

  const manifest = {
    apiVersion: DEFAULT_ARGOCD_API_VERSION,
    kind: "Application",
    metadata: {
      name: releaseName,
      finalizers: DEFAULT_FINALIZERS,
      labels: { name: releaseName },
      annotations: {
        "argocd.argoproj.io/sync-wave": "-1",
      },
    },
    spec: {
      project: DEFAULT_PROJECT,
      source: {
        repoURL: "https://kubernetes.github.io/ingress-nginx",
        chart: "ingress-nginx",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values: getYAMLString(values),
        },
        targetRevision: NGINX_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "ingress-public",
      },
      syncPolicy: {
        automated: {
          prune: true,
          selfHeal: true,
          allowEmpty: false,
        },
        syncOptions: [
          "Validate=false",
          "CreateNamespace=true",
          "PrunePropagationPolicy=foreground",
          "PruneLast=false",
        ],
        retry: {
          limit: 10,
          backoff: {
            duration: "5s",
            factor: 2,
            maxDuration: "4m",
          },
        },
      },
    },
  };

  return getYAMLString(manifest);
}
