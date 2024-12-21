import { CNDIConfig } from "src/types.ts";
import { getYAMLString } from "src/utils.ts";
import { deepMerge } from "deps";
import { LOKI_CHART_VERSION } from "consts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

export default function getKubeLokiApplicationManifest(
  cndi_config: CNDIConfig,
): string {
  const releaseName = "loki";

  const defaultLokiValues = {
    loki: {
      auth_enabled: false,
      commonConfig: {
        replication_factor: 1,
      },
      schemaConfig: {
        configs: [
          {
            from: "2024-04-01",
            store: "tsdb",
            object_store: "s3",
            schema: "v13",
            index: {
              prefix: "loki_index_",
              period: "24h",
            },
          },
        ],
      },
      pattern_ingester: {
        enabled: true,
      },
      limits_config: {
        allow_structured_metadata: true,
        volume_enabled: true,
      },
      ruler: {
        enable_api: true,
      },
    },
    minio: {
      enabled: true,
    },
    deploymentMode: "SingleBinary",
    singleBinary: {
      replicas: 1,
    },
    backend: {
      replicas: 0,
    },
    read: {
      replicas: 0,
    },
    write: {
      replicas: 0,
    },
    ingester: {
      replicas: 0,
    },
    querier: {
      replicas: 0,
    },
    queryFrontend: {
      replicas: 0,
    },
    queryScheduler: {
      replicas: 0,
    },
    distributor: {
      replicas: 0,
    },
    compactor: {
      replicas: 0,
    },
    indexGateway: {
      replicas: 0,
    },
    bloomCompactor: {
      replicas: 0,
    },
    bloomGateway: {
      replicas: 0,
    },
  };

  const lokiValues = deepMerge(
    defaultLokiValues,
    cndi_config?.infrastructure?.cndi?.observability?.loki?.values || {},
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
        chart: "loki",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values: getYAMLString(lokiValues),
        },
        targetRevision: LOKI_CHART_VERSION,
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
