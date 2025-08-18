import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

/**
 * Generates Terraform resource for SSH key file management
 */
export default function cndi_local_file_ssh_private_key(
  _cndi_config: NormalizedCNDIConfig,
) {
  const resourceConfig = {
    resource: {
      local_file: {
        ssh_private_key: {
          content: "${var.ssh_private_key}",
          filename: "${path.module}/ssh_key",
          file_permission: "0600",
        },
      },
    },
  };

  return getPrettyJSONString(resourceConfig);
}
