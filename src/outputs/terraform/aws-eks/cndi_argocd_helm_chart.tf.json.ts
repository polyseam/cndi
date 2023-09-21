import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getArgoATFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "argo-cd",
    cleanup_on_fail: true,
    create_namespace: "true",
    depends_on: [
      "module.cndi_eks_cluster",
    ],
    timeout: "600",
    atomic: true,
    name: "argocd",
    namespace: "argocd",
    replace: true,
    repository: "https://argoproj.github.io/argo-helm",
    version: "5.45.0",
  }, "cndi_argocd_helm_chart");
  return getPrettyJSONString(resource);
}
