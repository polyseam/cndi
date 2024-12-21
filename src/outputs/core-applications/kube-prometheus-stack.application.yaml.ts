import { CNDIConfig } from "src/types.ts";
import { getYAMLString } from "src/utils.ts";
import { deepMerge } from "deps";
import { KUBE_PROMETHEUS_STACK_CHART_VERSION } from "consts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

export default function getKubePrometheusStackApplicationManifest(
  cndi_config: CNDIConfig,
): string {
  const releaseName = "kube-prometheus-stack";

  const defaultKubePrometheusStackValues = {
    prometheusOperator: {
      // hooks found in the values.yaml file comments
      admissionWebhooks: {
        annotations: {
          "argocd.argoproj.io/hook": "PreSync",
          "argocd.argoproj.io/hook-delete-policy": "HookSucceeded",
        },
        mutatingWebhookConfiguration: {
          annotations: {
            "argocd.argoproj.io/hook": "PreSync",
          },
        },
        validatingWebhookConfiguration: {
          annotations: {
            "argocd.argoproj.io/hook": "PreSync",
          },
        },
        patch: {
          annotations: {
            "argocd.argoproj.io/hook": "PreSync",
            "argocd.argoproj.io/hook-delete-policy": "HookSucceeded",
          },
        },
      },
    },
    grafana: {
      additionalDataSources: [{
        name: "Loki",
        type: "loki",
        url: "http://loki:3100", // the loki service is in the "observability" namespace
        access: "proxy",
        isDefault: false,
        orgId: 1,
        jsonData: {
          maxLines: 1000,
        },
      }],
    },
  };

  const kubePrometheusStackValues = deepMerge(
    defaultKubePrometheusStackValues,
    cndi_config?.infrastructure?.cndi?.observability?.kube_prometheus_stack
      ?.values || {},
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
        repoURL: "https://prometheus-community.github.io/helm-charts",
        chart: "kube-prometheus-stack",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values: getYAMLString(kubePrometheusStackValues),
        },
        targetRevision: KUBE_PROMETHEUS_STACK_CHART_VERSION,
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
          "ServerSideApply=true", // annotations too long
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
