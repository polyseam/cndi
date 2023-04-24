import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "deps";
import { AWSEKSNodeItemSpec } from "src/types.ts";

export default function getAWSEKServiceNodeGroupTFJSON(
  node: AWSEKSNodeItemSpec,
): string {
  const max_size = node?.max_count || 1;
  const min_size = node?.min_count || 1;
  const desired_size = min_size;
  const disk_size = node?.volume_size || node?.disk_size || node?.size ||
    node?.disk_size_gb || DEFAULT_NODE_DISK_SIZE; //GiB
  const instance_type = node?.instance_type || DEFAULT_INSTANCE_TYPES.aws;
  const resource = getTFResource("aws_eks_node_group", {
    cluster_name: "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
    ami_type: "AL2_x86_64",
    disk_size,
    instance_types: [instance_type],
    node_group_name: node?.name,
    node_role_arn: "${aws_iam_role.cndi_aws_iam_role_eks_ec2.arn}",
    scaling_config: [{ desired_size, max_size, min_size }],
    capacity_type: "ON_DEMAND",
    subnet_ids: [
      "${aws_subnet.cndi_aws_subnet_private_a.id}",
    ],
    update_config: [{ max_unavailable: 1 }],
    depends_on: [
      "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_AmazonEKSWorkerNodePolicy",
      "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_AmazonEKS_CNI_Policy",
      "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_AmazonEC2ContainerRegistryReadOnly",
    ],
  });

  return getPrettyJSONString(resource);
}
