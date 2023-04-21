import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSEKSNodeGroupDataTFJSON(): string {
  const data = getTFData("aws_eks_node_group", {
    cluster_name: "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
    node_group_name:
      "${aws_eks_node_group.cndi_aws_eks_worker_node_group.node_group_name}",
  }, "cndi_data_aws_eks_worker_node_group");
  return getPrettyJSONString(data);
}
