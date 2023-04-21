import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getSecretArgocdAdminPasswordManifestTFJSON(): string {
  const resource = getTFResource("kubectl_manifest", {
    depends_on: ["helm_release.cndi_argocd_helm_chart"],
    yaml_body:
      "${data.template_file.cndi_data_template_file_argocd_admin_password_manifest.rendered}",
  }, "cndi_argocd_admin_password_secret_manifest");
  return getPrettyJSONString(resource);
}
