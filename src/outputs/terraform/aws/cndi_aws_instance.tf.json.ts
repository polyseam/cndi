import {
  getLeaderNodeNameFromConfig,
  getPrettyJSONString,
  getTFResource,
} from "src/utils.ts";
import { AWSNodeItemSpec, CNDIConfig } from "../../../types.ts";

export default function getAWSComputeInstanceTFJSON(
  node: AWSNodeItemSpec,
  config: CNDIConfig,
): string {
  const { name, role } = node;
  const leaderNodeName = getLeaderNodeNameFromConfig(config);
  const DEFAULT_AMI = "ami-0c1704bac156af62c";
  const DEFAULT_INSTANCE_TYPE = "m5a.large";
  const DEFAULT_VOLUME_SIZE = 100;
  const ami = node?.ami || DEFAULT_AMI;
  const instance_type = node?.instance_type || node?.machine_type ||
    DEFAULT_INSTANCE_TYPE;
  const delete_on_termination = false;
  const device_name = "/dev/sda1";
  const volume_size = node?.volume_size || node?.size || DEFAULT_VOLUME_SIZE; //GiB
  const volume_type = "gp3"; // general purpose SSD
  const subnet_id = `\${aws_subnet.cndi_aws_subnet[0].id}`;
  const vpc_security_group_ids = [
    "${aws_security_group.cndi_aws_security_group.id}",
  ];
  const ebs_block_device = [
    {
      device_name,
      volume_size,
      volume_type,
      delete_on_termination,
    },
  ];
  const leaderAWSInstance = `aws_instance.${leaderNodeName}`;
  const leader_user_data =
    '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${var.git_repo}", "git_password": "${var.git_password}", "git_username": "${var.git_username}", "sealed_secrets_private_key": "${var.sealed_secrets_private_key}", "sealed_secrets_public_key": "${var.sealed_secrets_public_key}", "argo_ui_admin_password": "${var.argo_ui_admin_password}" })}';
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
      ebs_block_device,
      subnet_id,
      vpc_security_group_ids,
      user_data,
      depends_on,
    },
    `${node.name}`,
  ).resource;

  return getPrettyJSONString({
    resource,
  });
}
