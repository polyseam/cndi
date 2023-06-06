import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSEKSClusterTFJSON(): string {
  const resource = getTFResource("aws_eks_cluster", {
    name: "${local.cndi_project_name}",
    role_arn: "${aws_iam_role.cndi_aws_iam_role_eks_ec2.arn}",
    version: "1.25",
    vpc_config: [
      {
        endpoint_private_access: true,
        endpoint_public_access: true,
        security_group_ids: [
          "${aws_security_group.cndi_aws_security_group.id}",
        ],
        subnet_ids: [
          "${aws_subnet.cndi_aws_subnet_private_a.id}",
          "${aws_subnet.cndi_aws_subnet_private_b.id}",
          "${aws_subnet.cndi_aws_subnet_public_a.id}",
        ],
      },
    ],
    enabled_cluster_log_types: [
      "api",
      "audit",
      "authenticator",
      "controllerManager",
      "scheduler",
    ],
    tags: {
      Name: "EKSClusterControlPlane",
      //  TODO: delete or uncomment CNDIProject: "${local.cndi_project_name}",
      "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
    },
    depends_on: [
      "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_eks_cluster_policy",
      "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_eks_service_policy",
    ],
  });
  return getPrettyJSONString(resource);
}
