import { getYAMLString } from "src/utils.ts";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { NGINX_CHART_VERSION } from "versions";
import { deepMerge } from "deps";
const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

const controller = {
  electionID: "private-controller-leader",
  ingressClassResource: {
    enabled: "true",
    name: "private",
    default: "false",
    controllerValue: "k8s.io/ingress-nginx-private",
  },
};

const eksValues = (project_name: string) => {
  return deepMerge({ controller }, {
    controller: {
      service: {
        internal: {
          enabled: "true",
        },
        annotations: {
          "service.beta.kubernetes.io/aws-load-balancer-scheme": "internal",
          "service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags":
            `CNDIProject=${project_name}`,
        },
      },
    },
  });
};

const devValues = () => {
  return deepMerge({ controller }, {
    controller: {
      service: {
        external: {
          enabled: "false",
        },
      },
    },
  });
};

const gkeValues = () => {
  return deepMerge({ controller }, {
    controller: {
      service: {
        internal: {
          enabled: "true",
        },
        annotations: {
          "networking.gke.io/load-balancer-type": "Internal",
        },
      },
    },
  });
};

const aksValues = () => {
  return deepMerge({ controller }, {
    controller: {
      service: {
        internal: {
          enabled: "true",
        },
        annotations: {
          "service.beta.kubernetes.io/azure-load-balancer-internal": "/healthz",
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
        "nodeSelector.kubernetes.io/os": "linux",
      },
      rbac: {
        create: "false",
      },
    },
  });
};

const getDefaultNginxValuesForCNDIProvider = (
  cndi_config: NormalizedCNDIConfig,
) => {
  const { distribution, project_name } = cndi_config;

  switch (distribution) {
    case "eks":
      return eksValues(project_name || "my-cndi-project");
    case "gke":
      return gkeValues();
    case "aks":
      return aksValues();
    case "microk8s":
      return devValues();
    default:
      return {};
  }
};

export default function getNginxApplicationManifest(
  cndi_config: NormalizedCNDIConfig,
) {
  if (cndi_config.distribution === "clusterless") return "";

  const releaseName = "ingress-nginx-private";
  const defaultValues = getDefaultNginxValuesForCNDIProvider(cndi_config);
  const userValues =
    cndi_config?.infrastructure?.cndi?.ingress?.nginx?.private?.values || {};

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
        namespace: "ingress-private",
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
