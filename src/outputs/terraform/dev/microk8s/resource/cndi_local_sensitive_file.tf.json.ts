import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export const cndi_local_sensitive_file_microk8s_leader_cloud_init =
  "cndi_local_sensitive_file_microk8s_leader_cloud_init";

export const filename =
  `${cndi_local_sensitive_file_microk8s_leader_cloud_init}.template.yml.tftpl`;

export default function (_cndi_config: CNDIConfig) {
  const resource = {
    local_sensitive_file: {
      [cndi_local_sensitive_file_microk8s_leader_cloud_init]: {
        filename,
        content:
          `\${templatefile(\"${filename}\", \"join_token\" = local.join_token, \"git_repo\" = var.GIT_REPO, \"git_token\" = var.GIT_TOKEN, \"git_username\" = var.GIT_USERNAME, \"sealed_secrets_private_key\" = base64encode(var.SEALED_SECRETS_PRIVATE_KEY), \"sealed_secrets_public_key\" = base64encode(var.SEALED_SECRETS_PUBLIC_KEY), \"argocd_admin_password\" = var.ARGOCD_ADMIN_PASSWORD})}`,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
