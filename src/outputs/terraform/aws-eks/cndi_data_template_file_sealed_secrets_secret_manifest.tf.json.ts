import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getTemplateSecretSealedTFJSON(): string {
  const data = getTFData("template_file", {
    template: '${file("templates/sealed_secrets_secret_manifest.yaml.tftpl")}',
    vars: {
      sealed_secret_cert_pem: "${var.sealed_secrets_public_key}",
      sealed_secret_private_key_pem: "${var.sealed_secrets_private_key}",
    },
  }, "cndi_data_template_file_sealed_secrets_secret_manifest");
  return getPrettyJSONString(data);
}
