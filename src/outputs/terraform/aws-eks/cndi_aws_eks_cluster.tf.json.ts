import { getPrettyJSONString, getTFModule } from "src/utils.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "consts";
import { AWSEKSNodeItemSpec } from "src/types.ts";

export default function getAWSEKSClusterTFJSON(
  node: AWSEKSNodeItemSpec,
): string {
  const max_size = node?.max_count || 1;
  const min_size = node?.min_count || 1;
  const desired_size = min_size;
  const disk_size = node?.volume_size || node?.disk_size || node?.size ||
    node?.disk_size_gb || DEFAULT_NODE_DISK_SIZE; //GiB
  const instance_type = node?.instance_type || DEFAULT_INSTANCE_TYPES.aws;
  // const node_group_name = node.name;
  const module = getTFModule("aws_eks_cluster", {
    cluster_name: "${local.cluster_name}",
    cluster_endpoint_public_access: true,
    cluster_version: "1.27",
    manage_aws_auth_configmap: false,
    cluster_endpoint_private_access: true,
    cluster_enabled_log_types: [
      "api",
      "audit",
      "authenticator",
      "controllerManager",
      "scheduler",
    ],
    eks_managed_node_groups: {
      eks_nodes: {
        desired_capacity: desired_size,
        instance_type: instance_type,
        disk_size: disk_size,
        max_capacity: max_size,
        min_capaicty: desired_size,
      },
    },
    subnet_ids: [
      "${aws_subnet.cndi_aws_subnet_private_a.id}",
      "${aws_subnet.cndi_aws_subnet_private_b.id}",
    ],
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
    source: "terraform-aws-modules/eks/aws",
    version: "19.16.0",
    tags: {
      Name: "EKSClusterControlPlane",
      "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
    },
  });

  return getPrettyJSONString(module);
}
