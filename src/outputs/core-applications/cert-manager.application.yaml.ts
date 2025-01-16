import { getYAMLString } from "src/utils.ts";
import { CERT_MANAGER_CHART_VERSION } from "versions";
import { CNDIConfig } from "src/types.ts";

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

export default function getCertManagerApplicationManifest(
  cndi_config: CNDIConfig,
): string {
  const releaseName = "cert-manager";
  const userValues = cndi_config?.infrastructure?.cndi?.cert_manager?.values ||
    {};

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
        repoURL: "https://charts.jetstack.io",
        chart: "cert-manager",
        helm: {
          version: DEFAULT_HELM_VERSION,
          values: getYAMLString({ installCRDs: true, ...userValues }),
        },
        targetRevision: CERT_MANAGER_CHART_VERSION,
      },
      destination: {
        server: DEFAULT_DESTINATION_SERVER,
        namespace: "cert-manager",
      },
      ignoreDifferences: [
        {
          group: "admissionregistration.k8s.io",
          kind: "ValidatingWebhookConfiguration",
          name: "cert-manager-webhook",
          jqPathExpressions: [
            '.webhooks[].namespaceSelector.matchExpressions[] | select(.key == "control-plane")',
            '.webhooks[].namespaceSelector.matchExpressions[] | select(.key == "kubernetes.azure.com/managedby")',
          ],
        },
      ],
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
