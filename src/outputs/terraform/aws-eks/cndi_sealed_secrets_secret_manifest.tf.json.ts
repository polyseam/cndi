import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getSecretSealedSecretsTFJSON(): string {
  const resource = getTFResource("kubectl_manifest", {
    depends_on: ["helm_release.cndi_sealed_secrets_helm_chart"],
    yaml_body: "${data.template_file.sealed_secrets_secret_manifest.rendered}",
  }, "cndi_sealed_secrets_secret_manifest");
  return getPrettyJSONString(resource);
}
