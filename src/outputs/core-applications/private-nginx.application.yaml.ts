import { getYAMLString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import { NGINX_VERSION } from "consts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

const getDefaultControllerConfig = () => ({
  electionID: "private-controller-leader",
  ingressClassResource: {
    enabled: "true",
    name: "private",
    default: "false",
    controllerValue: "k8s.io/ingress-nginx-private",
  },
});

const eksValues = (cndi_config: CNDIConfig) => ({
  controller: {
    ...getDefaultControllerConfig(),
    service: {
      internal: {
        enabled: "true",
      },
      annotations: {
        "service.beta.kubernetes.io/aws-load-balancer-scheme": "internal",
      },
    },
  },
  ...cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public?.values || {},
});

const gkeValues = (cndi_config: CNDIConfig) => ({
  controller: {
    ...getDefaultControllerConfig(),
    service: {
      annotations: {
        "service.beta.kubernetes.io/networking.gke.io/load-balancer-type":
          "Internal",
      },
    },
  },
  ...cndi_config?.infrastructure?.cndi?.ingress?.nginx?.private?.values || {},
});

const aksValues = (cndi_config: CNDIConfig) => (
  {
    controller: {
      ...getDefaultControllerConfig(),
      service: {
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
    ...cndi_config?.infrastructure?.cndi?.ingress?.nginx?.private.values || {},
  }
);

const getDefaultNginxValuesForCNDIProvider = (cndi_config: CNDIConfig) => {
  const cndiDistribution = cndi_config.distribution;
  const providerConfigs = {
    eks: eksValues(cndi_config),
    gke: gkeValues(cndi_config),
    aks: aksValues(cndi_config),
    microk8s: gkeValues(cndi_config),
  };
  const config = providerConfigs[cndiDistribution];

  return config;
};

export default function getNginxApplicationManifest(
  cndi_config: CNDIConfig,
) {
  const releaseName = "ingress-nginx-private";
  const config = cndi_config;
  const values = getDefaultNginxValuesForCNDIProvider(config);

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
        targetRevision: NGINX_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "ingress-private",
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
