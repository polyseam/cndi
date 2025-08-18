import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

/**
 * Generates Terraform resource for kubeconfig file management
 */
export default function cndi_local_file_final_kubeconfig(
  _cndi_config: NormalizedCNDIConfig,
) {
  const resourceConfig = {
    resource: {
      local_file: {
        final_kubeconfig: {
          depends_on: ["data.local_file.kubeconfig"],
          content:
            '${replace(local.kubeconfig_content, "https://127.0.0.1:6443", local.k3s_cluster_endpoint)}',
          filename: "${path.module}/kubeconfig-final",
          file_permission: "0600",
        },
      },
    },
  };

  return getPrettyJSONString(resourceConfig);
}
