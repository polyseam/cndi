import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";
import { DEFAULT_INSTANCE_TYPES } from "constants";

export default function getAWSComputeInstanceTFJSON(
  node: AWSEC2NodeItemSpec,
  leaderNodeName: string,
): string {
  const { name, role } = node;
  const DEFAULT_EC2_AMI = "ami-0c1704bac156af62c";
  const ami = node?.ami || DEFAULT_EC2_AMI; // AMI to use for the instance.
  const instance_type = node?.instance_type || DEFAULT_INSTANCE_TYPES.aws; //Instance type to use for the instance
  const subnet_id = `\${aws_subnet.cndi_aws_subnet[0].id}`; // VPC Subnet ID to launch in.
  const vpc_security_group_ids = [
    "${aws_security_group.cndi_aws_security_group.id}",
  ]; // List of security group IDs to associate with.
  const leaderAWSInstance = `aws_instance.cndi_aws_instance_${leaderNodeName}`;
  const leader_user_data =
    '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${var.git_repo}", "git_password": "${var.git_password}", "git_username": "${var.git_username}", "sealed_secrets_private_key": "${var.sealed_secrets_private_key}", "sealed_secrets_public_key": "${var.sealed_secrets_public_key}", "argocd_admin_password": "${var.argocd_admin_password}" })}';
  const controller_user_data =
    '${templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"})}';
  const user_data = role === "leader" ? leader_user_data : controller_user_data;
  const depends_on = role !== "leader" ? [leaderAWSInstance] : [];

  const resource = getTFResource(
    "aws_instance",
    {
      ami,
      instance_type,
      tags: {
        Name: name,
        CNDIProject: "${local.cndi_project_name}",
        CNDINodeRole: role,
      },
      subnet_id,
      vpc_security_group_ids,
      user_data,
      depends_on,
    },
    `cndi_aws_instance_${node.name}`,
  ).resource;

  return getPrettyJSONString({
    resource,
  });
}
