import { getYAMLString } from "src/utils.ts";
import { CNDIConfig, CNDIPort } from "src/types.ts";
import { NGINX_CHART_VERSION } from "consts";
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

type TCPSpec = Record<number, string>;

const getTCPConfig = (open_ports: CNDIPort[]): TCPSpec => {
  const tcp: TCPSpec = {};
  open_ports.forEach((port: CNDIPort) => {
    if (port.disable) return;
    tcp[port.number] = `${port.namespace}/${port.service}:${port.number}`;
  });
  return tcp;
};

const getBaseValues = (cndi_config: CNDIConfig) =>
  deepMerge(
    {
      controller: getDefaultControllerConfig(),
      tcp: getTCPConfig(cndi_config?.infrastructure?.cndi?.open_ports || []),
    },
    cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public?.values || {},
  );

const eksValues = (cndi_config: CNDIConfig) =>
  deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        annotations: {
          "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
          "service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags":
            `CNDIProject=${cndi_config.project_name}`,
        },
      },
    },
  });

const gkeValues = (cndi_config: CNDIConfig) => getBaseValues(cndi_config);

const devValues = (cndi_config: CNDIConfig) =>
  deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        external: {
          enabled: false,
        },
      },
    },
  });

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
    microk8s: devValues(cndi_config), // Not ready
    clusterless: null,
  };

  return providerConfigs[cndiDistribution];
};

export default function getNginxApplicationManifest(cndi_config: CNDIConfig) {
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
        targetRevision: NGINX_CHART_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "ingress-public",
      },
      syncPolicy: {
        automated: {
          prune: true,
          selfHeal: true,
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
