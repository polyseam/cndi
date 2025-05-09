import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export const cndi_cloud_init_name =
  "cndi_leader_local_sensitive_file_cloud_init";
export const cndi_cloud_init_filename = `${name}.yml.tftpl`;

export default function (_cndi_config: CNDIConfig) {
  const resource = {
    local_sensitive_file: {
      [cndi_cloud_init_name]: {
        cndi_cloud_init_filename,
        content:
          `\${templatefile(\"${cndi_cloud_init_filename}\", \"bootstrap_token\" = local.bootstrap_token, \"git_repo\" = var.GIT_REPO, \"git_token\" = var.GIT_TOKEN, \"git_username\" = var.GIT_USERNAME, \"sealed_secrets_private_key\" = base64encode(var.SEALED_SECRETS_PRIVATE_KEY), \"sealed_secrets_public_key\" = base64encode(var.SEALED_SECRETS_PUBLIC_KEY), \"argocd_admin_password\" = var.ARGOCD_ADMIN_PASSWORD})}`,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
