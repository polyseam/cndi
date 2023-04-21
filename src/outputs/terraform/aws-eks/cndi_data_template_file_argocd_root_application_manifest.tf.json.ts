import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getTemplateRootApplicationTFJSON(): string {
  const data = getTFData("template_file", {
    template:
      '${file("templates/argocd_root_application_manifest.yaml.tftpl")}',
    vars: {
      git_repo: "${var.git_repo}",
    },
  }, "cndi_data_template_file_argocd_root_application_manfest");
  return getPrettyJSONString(data);
}
