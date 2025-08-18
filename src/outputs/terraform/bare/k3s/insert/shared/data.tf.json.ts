import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
/**
 * Data sources used by the example insert: tailscale devices and local files
 */
export default function getDataTfJSON(
  _cndi_config: NormalizedCNDIConfig,
): string {
  // Use an unfiltered fleet data source; filtering by tag is handled in locals
  const data = {
    tailscale_devices: {
      fleet: {},
    },
    local_file: {
      kubeconfig: {
        depends_on: ["null_resource.k3s_cluster_info"],
        filename: "${path.module}/kubeconfig",
      },
      k3s_token: {
        depends_on: ["null_resource.k3s_cluster_info"],
        filename: "${path.module}/k3s-token",
      },
    },
  };

  return getPrettyJSONString({ data });
}
