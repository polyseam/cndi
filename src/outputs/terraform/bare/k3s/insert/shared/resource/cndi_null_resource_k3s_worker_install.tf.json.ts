import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

/**
 * Generates Terraform resource for k3s worker installation
 */
export default function cndi_null_resource_k3s_worker_install(
  _cndi_config: NormalizedCNDIConfig,
) {
  const resource = {
    resource: {
      null_resource: {
        worker: {
          for_each:
            "${{ for id, n in local.nodes_by_id : id => n if id != local.leader_id }}",
          depends_on: ["null_resource.leader"],
          connection: {
            type: "ssh",
            host: "${each.value.ip}",
            user: "${var.ssh_user}",
            private_key: "${var.ssh_private_key}",
            timeout: "2m",
          },
          provisioner: [
            {
              file: {
                content: "${local.k3s_bootstrap}",
                destination: "/tmp/cndi-k3s.sh",
              },
            },
            {
              remote_exec: {
                inline: [
                  "sudo install -m 0700 /tmp/cndi-k3s.sh /usr/local/bin/cndi-k3s",
                  "ROLE=worker K3S_VERSION='${var.k3s_version}' K3S_TOKEN='${random_password.k3s_token.result}' SERVER_IP='${local.leader_ip}' DISABLE_SVCLB='${var.disable_servicelb}' DISABLE_TRAEFIK='${var.disable_traefik}' SERVER_ARGS='' AGENT_ARGS='${join(\" \", var.agent_extra_args)}' TLS_SANS='' FINGERPRINT='${local.node_fingerprints[each.key]}' sudo /usr/local/bin/cndi-k3s",
                ],
              },
            },
          ],
          triggers: {
            id: "${each.key}",
            ip: "${each.value.ip}",
            fingerprint: "${local.node_fingerprints[each.key]}",
          },
        },
      },
    },
  };

  return getPrettyJSONString({ resource });
}
