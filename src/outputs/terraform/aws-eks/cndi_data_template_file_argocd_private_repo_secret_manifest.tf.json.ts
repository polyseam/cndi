import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getTemplateSecretArgoPrivateRepoTFJSON(): string {
  const data = getTFData("template_file", {
    template:
      '${file("templates/argocd_private_repo_secret_manifest.yaml.tftpl")}',
    vars: {
      git_password: "${var.git_password}",
      git_repo: "${var.git_repo}",
      git_username: "${var.git_username}",
    },
  }, "cndi_data_template_file_argocd_private_repo_secret_manifest");
  return getPrettyJSONString(data);
}
