import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getArgoATFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "argo-cd",
    cleanup_on_fail: true,
    create_namespace: "true",
    depends_on: [
      "aws_efs_file_system.cndi_aws_efs_file_system",
      "aws_eks_node_group.cndi_aws_eks_node_group",
    ],
    force_update: true,
    name: "argo-cd",
    namespace: "argocd",
    replace: true,
    repository: "https://argoproj.github.io/argo-helm",
    version: "${local.argocd_version}",
  }, "cndi_argocd_helm_chart");
  return getPrettyJSONString(resource);
}
