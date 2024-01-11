import { getYAMLString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import type { CNDIProvider, ExternalDNSProvider } from "src/types.ts";
import { EXTERNAL_DNS_VERSION } from "consts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_NAMESPACE = "default";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

const getDefaultExternalDNSProviderForCNDIProvider = (
  cndiProvider: CNDIProvider,
): ExternalDNSProvider => {
  if (cndiProvider === "gcp") return "google";
  if (cndiProvider === "dev") return "aws";
  return cndiProvider;
};

const getApplicationManifest = (
  cndi_config: CNDIConfig,
): string => {
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

  type ExternalDNSValues = {
    provider: ExternalDNSProvider;
    domainFilters: Array<string>;
    [key: string]: unknown;
    extraEnvVarsSecret?: string;
  };

  const values: ExternalDNSValues = {
    ...cndi_config?.infrastructure?.cndi?.external_dns?.values,
    provider: externalDNSProvider,
    domainFilters: domain_filters,
  };

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
      namespace: DEFAULT_NAMESPACE,
      finalizers: DEFAULT_FINALIZERS,
      labels: { name: releaseName },
    },
    spec: {
      project: DEFAULT_PROJECT,
      source: {
        repoURL: "https://charts.bitnami.com/bitnami",
        chart: "external-dns",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values,
        },
        targetRevision: EXTERNAL_DNS_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "external-dns",
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
};

export default getApplicationManifest;
