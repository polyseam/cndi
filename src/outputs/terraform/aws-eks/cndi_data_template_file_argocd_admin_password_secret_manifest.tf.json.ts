import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getTemplateSecretArgocdAdminPasswordTFJSON(): string {
  const data = getTFData("template_file", {
    template:
      '${file("templates/argocd_admin_password_secret_manifest.yaml.tftpl")}',
    vars: {
      admin_password_time:
        "${time_static.cndi_time_static_admin_password_update.id}",
      argocd_admin_password:
        "${bcrypt_hash.cndi_bcrypt_hash_argocd_admin_password.id}",
    },
  }, "cndi_data_template_file_argocd_admin_password_secret_manifest");
  return getPrettyJSONString(data);
}
