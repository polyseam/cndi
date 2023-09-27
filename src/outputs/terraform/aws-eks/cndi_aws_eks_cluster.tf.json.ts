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
    cluster_name: "${local.cndi_project_name}",
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
    eks_managed_node_group_defaults: {
      ami_type: "AL2_x86_64",
    },
    create_iam_role: true,
    iam_role_additional_policies: {
      AmazonEKSClusterPolicy: "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
      AmazonEKSServicePolicy: "arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
      EKS: "${data.aws_iam_policy.cndi_aws_iam_policy_eks.arn}",
    },

    eks_managed_node_groups: {
      eks_node_group: {
        name: node?.name,
        instance_type: instance_type,
        disk_size: disk_size,
        max_capacity: max_size,
        min_capaicty: desired_size,
        create_iam_role: true,
        iam_role_additional_policies: {
          AmazonEC2ContainerRegistryReadOnly:
            "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
          AmazonEKS_CNI_Policy: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
          AmazonEKSWorkerNodePolicy:
            "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
          AmazonEBSCSIDriverPolicy:
            "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy",
          AmazonEFSCSIDriverPolicy:
            "arn:aws:iam::aws:policy/service-role/AmazonEFSCSIDriverPolicy",
          EC2: "${data.aws_iam_policy.cndi_aws_iam_policy_ec2.arn}",
        },
      },
    },
    subnet_ids: "${module.cndi_aws_vpc.private_subnets}",
    vpc_id: "${module.cndi_aws_vpc.vpc_id}",
    source: "terraform-aws-modules/eks/aws",
    version: "19.16.0",
    tags: {
      CNDIProject: "${local.cndi_project_name}",
    },
  });

  return getPrettyJSONString(module);
}
