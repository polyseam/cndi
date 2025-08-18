import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

/**
 * Variables matching example.hcl for k3s insert
 */
export default function getVariableTfJSON(
  _cndi_config: NormalizedCNDIConfig,
): string {
  const variable = {
    ssh_user: { type: "string", default: "ubuntu" },
    ssh_private_key: { type: "string", sensitive: true },
    k3s_version: { type: "string", default: "stable" },
    disable_servicelb: { type: "bool", default: false },
    disable_traefik: { type: "bool", default: true },
    server_extra_args: { type: ["list", "string"], default: [] },
    agent_extra_args: { type: ["list", "string"], default: [] },
    tls_sans: { type: ["list", "string"], default: [] },
  };

  return getPrettyJSONString({ variable });
}
