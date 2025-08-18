import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

/**
 * Generates Terraform resource for k3s leader installation
 */
export default function cndi_null_resource_k3s_leader_install(
  cndi_config: NormalizedCNDIConfig,
) {
  const nodes = cndi_config.infrastructure.cndi.nodes;
  const isAutoMode = nodes === "auto" ||
    (Array.isArray(nodes) && nodes.length === 0);

  const host = isAutoMode ? "${local.leader_ip}" : "${local.leader_node.host}";

  const resource = {
    resource: {
      null_resource: {
        leader: {
          triggers: {
            id: "${local.leader_id}",
            ip: "${local.leader_ip}",
            fingerprint: "${local.node_fingerprints[local.leader_id]}",
          },
          connection: {
            type: "ssh",
            host,
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
                  "ROLE=leader K3S_VERSION='${var.k3s_version}' K3S_TOKEN='${random_password.k3s_token.result}' SERVER_IP='${local.leader_ip}' DISABLE_SVCLB='${var.disable_servicelb}' DISABLE_TRAEFIK='${var.disable_traefik}' SERVER_ARGS='${join(\" \", var.server_extra_args)}' AGENT_ARGS='' TLS_SANS='${join(\" \", var.tls_sans)}' FINGERPRINT='${local.node_fingerprints[local.leader_id]}' sudo /usr/local/bin/cndi-k3s",
                ],
              },
            },
          ],
        },
      },
    },
  };

  return getPrettyJSONString({ resource });
}
