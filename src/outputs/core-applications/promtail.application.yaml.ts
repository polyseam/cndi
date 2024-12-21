import { CNDIConfig } from "src/types.ts";
import { getYAMLString } from "src/utils.ts";
import { deepMerge } from "deps";
import { PROMTAIL_CHART_VERSION } from "consts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

export default function getKubePromtailApplicationManifest(
  cndi_config: CNDIConfig,
): string {
  const releaseName = "promtail";

  const defaultPromtailValues = {
    config: {
      clients: [{
        url: "http://loki-gateway/loki/api/v1/push",
        tenant_id: 1,
      }],
    },
  };

  const promtailValues = deepMerge(
    defaultPromtailValues,
    cndi_config?.infrastructure?.cndi?.observability?.promtail?.values || {},
  );

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
        repoURL: "https://grafana.github.io/helm-charts",
        chart: "promtail",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values: getYAMLString(promtailValues),
        },
        targetRevision: PROMTAIL_CHART_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "observability",
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
