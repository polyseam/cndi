import { getYAMLString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import { NGINX_CONTROLLER_VERSION } from "consts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

export default function getExternalDNSApplicationManifest(
  cndi_config: CNDIConfig,
): string {
  const releaseName = "ingress-nginx-public";

  type ExternalDNSValues = {
    private?: boolean;
    [key: string]: unknown;
  };

  const values: ExternalDNSValues = {
    ...cndi_config?.infrastructure?.cndi?.external_dns?.values,

    "controller.ingressClassResource.controllerValue": "k8s.io/public-nginx",
    "k8s.io/public-nginx": "false",
    "controller.ingressClassResource.enabled": "true",
    "controller.ingressClassResource.name": "public",
    "controller.extraArgs.tcp-services-configmap":
    "ingress-public/ingress-nginx-public-controller",
  };
  if (externalDNSCannotUseEnvVars.) {
    // this dns provider uses another method for authentication, probably volume mounts
    values[externalDNSProvider] = {
      secretName: "external-dns",
    };
  } else {
    values.extraEnvVarsSecret = "external-dns";
  }
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
        targetRevision: NGINX_CONTROLLER_VERSION,
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
