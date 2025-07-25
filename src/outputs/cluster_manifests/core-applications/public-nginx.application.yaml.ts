import { getYAMLString } from "src/utils.ts";
import { CNDIPort, NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { NGINX_CHART_VERSION } from "versions";
import { deepMerge } from "deps";
import { getNodeResourceGroupName } from "src/outputs/terraform/azure/utils.ts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

const controller = {
  electionID: "public-controller-leader",
  ingressClassResource: {
    enabled: "true",
    name: "public",
    default: "false",
    controllerValue: "k8s.io/ingress-nginx-public",
  },
};

type TCPSpec = Record<number, string>;

const getTCPConfig = (open_ports: CNDIPort[]): TCPSpec => {
  const tcp: TCPSpec = {};
  open_ports.forEach((port: CNDIPort) => {
    if (port.disable) return;
    tcp[port.number] = `${port.namespace}/${port.service}:${port.number}`;
  });
  return tcp;
};

const getBaseValues = (cndi_config: NormalizedCNDIConfig) => {
  const tcp = getTCPConfig(cndi_config?.infrastructure?.cndi?.open_ports || []);
  return { tcp, controller };
};

const eksValues = (cndi_config: NormalizedCNDIConfig) => {
  const { project_name } = cndi_config;

  const annotations: Record<string, string> = {
    "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
    "service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags":
      `CNDIProject=${project_name}`,
    "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing",
  };

  return deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        annotations,
      },
    },
  });
};

const gkeValues = (cndi_config: NormalizedCNDIConfig) =>
  getBaseValues(cndi_config);

const devValues = (cndi_config: NormalizedCNDIConfig) =>
  deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        external: {
          enabled: false,
        },
      },
    },
  });

const aksValues = (cndi_config: NormalizedCNDIConfig) =>
  deepMerge(getBaseValues(cndi_config), {
    controller: {
      service: {
        annotations: {
          "service.beta.kubernetes.io/azure-load-balancer-resource-group":
            getNodeResourceGroupName(cndi_config),
          "service.beta.kubernetes.io/azure-load-balancer-health-probe-request-path":
            "/healthz",
          "service.beta.kubernetes.io/azure-load-balancer-health-probe-port":
            "10254",
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

const getDefaultNginxValuesForCNDIProvider = (
  cndi_config: NormalizedCNDIConfig,
) => {
  const { distribution } = cndi_config;

  switch (distribution) {
    case "eks":
      return eksValues(cndi_config);
    case "gke":
      return gkeValues(cndi_config);
    case "aks":
      return aksValues(cndi_config);
    case "microk8s":
      return devValues(cndi_config);
    default:
      return {};
  }
};

export default function getNginxApplicationManifest(
  cndi_config: NormalizedCNDIConfig,
) {
  if (cndi_config.distribution === "clusterless") return "";
  const releaseName = "ingress-nginx-public";

  const defaultValues = getDefaultNginxValuesForCNDIProvider(cndi_config);
  const userValues =
    cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public?.values || {};

  const values = getYAMLString(deepMerge(defaultValues, userValues));

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
          values,
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
