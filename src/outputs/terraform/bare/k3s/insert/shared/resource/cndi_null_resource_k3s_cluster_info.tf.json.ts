import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

/**
 * Generates Terraform resource for k3s cluster info extraction
 */
export default function cndi_null_resource_k3s_cluster_info(
  _cndi_config: NormalizedCNDIConfig,
) {
  const resourceConfig = {
    resource: {
      null_resource: {
        k3s_cluster_info: {
          depends_on: ["null_resource.leader"],
          connection: {
            type: "ssh",
            host: "${local.leader_ip}",
            user: "${var.ssh_user}",
            private_key: "${var.ssh_private_key}",
            timeout: "2m",
          },
          provisioner: [
            {
              local_exec: {
                command:
                  "ssh -o StrictHostKeyChecking=no -i ${path.module}/ssh_key ${var.ssh_user}@${local.leader_ip} 'cat /var/lib/rancher/k3s/server/node-token' > ${path.module}/k3s-token",
              },
            },
            {
              local_exec: {
                command:
                  "ssh -o StrictHostKeyChecking=no -i ${path.module}/ssh_key ${var.ssh_user}@${local.leader_ip} 'cat /etc/rancher/k3s/k3s.yaml' > ${path.module}/kubeconfig",
              },
            },
          ],
        },
      },
    },
  };

  return getPrettyJSONString(resourceConfig);
}
