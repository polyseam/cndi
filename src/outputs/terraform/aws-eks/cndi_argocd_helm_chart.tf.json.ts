import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getArgoATFJSON(firstNodeGroupName: string): string {
  const resource = getTFResource("helm_release", {
    chart: "argo-cd",
    cleanup_on_fail: true,
    create_namespace: "true",
    depends_on: [
      "aws_efs_file_system.cndi_aws_efs_file_system",
      `aws_eks_node_group.cndi_aws_eks_node_group_${firstNodeGroupName}`,
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
