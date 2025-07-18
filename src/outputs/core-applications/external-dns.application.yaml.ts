import { getYAMLString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import type { CNDIProvider, ExternalDNSProvider } from "src/types.ts";
import { EXTERNAL_DNS_CHART_VERSION } from "versions";
import { deepMerge } from "deps";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];
const EXCLUDED_FROM_EXTERNAL_DNS = ["devmode.cndi.link"];

const getDefaultExternalDNSProviderForCNDIProvider = (
  cndiProvider: CNDIProvider,
): ExternalDNSProvider => {
  if (cndiProvider === "gcp") return "google";
  if (cndiProvider === "dev") return "aws";
  return cndiProvider;
};

export default function getExternalDNSApplicationManifest(
  cndi_config: CNDIConfig,
): string {
  const releaseName = "external-dns";
  const cndiProvider = cndi_config.provider;

  const domain_filters =
    cndi_config?.infrastructure?.cndi?.external_dns?.domain_filters || [];

  const externalDNSProvider = // aws
    cndi_config?.infrastructure?.cndi?.external_dns?.provider ||
    getDefaultExternalDNSProviderForCNDIProvider(cndiProvider);

  const externalDNSCannotUseEnvVars = [
    "alibaba",
    "azure",
    "azure-private-dns",
    "transip",
    "oci",
  ];

  const userValues = cndi_config?.infrastructure?.cndi?.external_dns?.values ||
    {};

  const values = deepMerge({
    txtOwnerId: cndi_config?.project_name || "external-dns",
    txtSuffix: "txt",
    policy: "sync",
    interval: "30s",
    provider: externalDNSProvider,
    domainFilters: domain_filters,
    excludeDomains: EXCLUDED_FROM_EXTERNAL_DNS,
  }, userValues);

  if (externalDNSCannotUseEnvVars.includes(externalDNSProvider)) {
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
      annotations: {
        "argocd.argoproj.io/sync-wave": "-1",
      },
    },
    spec: {
      project: DEFAULT_PROJECT,
      source: {
        repoURL: "https://charts.bitnami.com/bitnami",
        chart: "external-dns",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values: getYAMLString(values),
        },
        targetRevision: EXTERNAL_DNS_CHART_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "external-dns",
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
          "PruneLast=true",
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
