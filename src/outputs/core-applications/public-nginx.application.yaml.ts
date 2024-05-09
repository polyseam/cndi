import { getYAMLString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import type { CNDIProvider } from "src/types.ts";
import { NGINX_VERSION } from "consts";

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

const getDefaultNginxValuesForCNDIProvider = (
  cndiProvider: CNDIProvider,
  cndi_config: CNDIConfig,
) => {
  const awsValues = {
    controller: {
      ...getDefaultControllerConfig(),
      service: {
        annotations: {
          "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
          "service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags":
            `${cndi_config.project_name}`,
        },
      },
    },
    ...cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public?.values || {},
  };
  const gcpValues = {
    controller: {
      ...getDefaultControllerConfig(),
    },
    ...cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public?.values || {},
  };

  const azureValues = {
    controller: {
      ...getDefaultControllerConfig(),
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
        "nodeSelector.kubernetes.io/os": "linux",
      },
      rbac: {
        create: "false",
      },
    },
    ...cndi_config?.infrastructure?.cndi?.ingress?.nginx?.public.values || {},
  };

  if (cndiProvider === "gcp") return gcpValues;
  if (cndiProvider === "aws") return awsValues;
  if (cndiProvider === "azure") return azureValues;
  return cndiProvider;
};

export default function getNginxApplicationManifest(): string {
  const releaseName = "ingress-nginx-public";

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
          values: getYAMLString(getDefaultNginxValuesForCNDIProvider),
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
