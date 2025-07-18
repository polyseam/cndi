import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ARGOCD_APPS_CHART_VERSION } from "versions";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const resource = {
    helm_release: {
      cndi_helm_release_argocd_apps: {
        atomic: true,
        chart: "argocd-apps",
        create_namespace: true,
        depends_on: [
          "helm_release.cndi_helm_release_argocd",
          "kubernetes_secret.cndi_kubernetes_secret_argocd_private_repo",
        ],
        name: "root-argo-app",
        namespace: "argocd",
        repository: "https://argoproj.github.io/argo-helm",
        timeout: 600,
        values: [
          '${yamlencode({"applications" = [{"name" = "root-application", "namespace" = "argocd", "project" = "default", "finalizers" = ["resources-finalizer.argocd.argoproj.io"], "source" = {"repoURL" = var.GIT_REPO, "path" = "cndi/cluster_manifests", "targetRevision" = "HEAD", "directory" = {"recurse" = true}}, "destination" = {"server" = "https://kubernetes.default.svc", "namespace" = "argocd"}, "syncPolicy" = {"automated" = {"prune" = true, "selfHeal" = true}, "syncOptions" = ["CreateNamespace=true"]}}]})}',
        ],
        version: ARGOCD_APPS_CHART_VERSION,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
