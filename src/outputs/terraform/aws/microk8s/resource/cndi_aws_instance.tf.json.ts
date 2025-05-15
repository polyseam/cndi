import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import {
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_NODE_DISK_SIZE_UNMANAGED,
} from "consts";
import { useSshRepoAuth } from "src/utils.ts";

const DEFAULT_EC2_AMI = "ami-0c1704bac156af62c";

export default function (cndi_config: CNDIConfig) {
  const project_name = "${local.cndi_project_name}";
  const nodes = cndi_config.infrastructure.cndi.nodes;
  const instances: Record<string, any> = {};

  nodes.forEach((node, index) => {
    const count = node?.count || 1;
    const role = index === 0
      ? "leader"
      : (node?.role === "worker" ? "worker" : "controller");
    const volumeSize = node?.volume_size || node?.disk_size ||
      node?.disk_size_gb || DEFAULT_NODE_DISK_SIZE_UNMANAGED;

    for (let i = 0; i < count; i++) {
      const nodeName = `${node.name}-${i}`;
      const userData = role === "leader"
        ? (useSshRepoAuth()
          ? '${templatefile("microk8s-cloud-init-leader.yml.tftpl", { join_token = local.join_token, git_repo_encoded = base64encode(var.git_repo), git_repo = var.git_repo, git_ssh_private_key = base64encode(var.git_ssh_private_key), sealed_secrets_private_key = base64encode(var.sealed_secrets_private_key), sealed_secrets_public_key = base64encode(var.sealed_secrets_public_key), argocd_admin_password = var.argocd_admin_password })}'
          : '${templatefile("microk8s-cloud-init-leader.yml.tftpl", { join_token = local.join_token, git_repo = var.git_repo, git_token = var.git_token, git_username = var.git_username, sealed_secrets_private_key = base64encode(var.sealed_secrets_private_key), sealed_secrets_public_key = base64encode(var.sealed_secrets_public_key), argocd_admin_password = var.argocd_admin_password })}')
        : '${templatefile("microk8s-cloud-init-' + role +
          '.yml.tftpl", { join_token = local.join_token, leader_node_ip = aws_instance.cndi_aws_instance_' +
          nodes[0].name + "-0.private_ip })}";

      instances[`cndi_aws_instance_${nodeName}`] = {
        ami: DEFAULT_EC2_AMI,
        instance_type: node?.instance_type || DEFAULT_INSTANCE_TYPES.aws,
        key_name: "${aws_key_pair.cndi_aws_key_pair.key_name}",
        subnet_id: "${aws_subnet.cndi_aws_subnet.id}",
        vpc_security_group_ids: [
          "${aws_security_group.cndi_aws_security_group.id}",
        ],
        user_data: userData,
        user_data_replace_on_change: false,
        root_block_device: {
          volume_type: "gp3",
          volume_size: volumeSize,
          delete_on_termination: true,
        },
        tags: {
          Name: nodeName,
        },
        depends_on: role === "leader"
          ? ["aws_internet_gateway.cndi_aws_internet_gateway"]
          : ["aws_instance.cndi_aws_instance_" + nodes[0].name + "-0"],
      };
    }
  });

  return getPrettyJSONString({
    resource: {
      aws_instance: instances,
    },
  });
}
