import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getArgoATFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "argo-cd",
    cleanup_on_fail: true,
    create_namespace: "true",
    depends_on: [
      "module.cndi_aws_eks_cluster",
      "helm_release.cndi_ebs_driver_helm_chart",
      "helm_release.cndi_efs_driver_helm_chart",
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
