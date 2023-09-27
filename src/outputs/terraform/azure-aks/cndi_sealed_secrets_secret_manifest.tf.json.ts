import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getSecretSealedSecretsTFJSON(): string {
  const resource = getTFResource("kubectl_manifest", {
    depends_on: ["module.cndi_aks_cluster"],
    yaml_body: "${data.template_file.sealed_secrets_secret_manifest.rendered}",
  }, "cndi_sealed_secrets_secret_manifest");
  return getPrettyJSONString(resource);
}
