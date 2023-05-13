import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getSecretSealedSecretsTFJSON(): string {
  const resource = getTFResource("kubectl_manifest", {
    depends_on: ["aws_eks_node_group.cndi_aws_eks_node_group"],
    yaml_body: "${data.template_file.sealed_secrets_secret_manifest.rendered}",
  }, "cndi_sealed_secrets_secret_manifest");
  return getPrettyJSONString(resource);
}
