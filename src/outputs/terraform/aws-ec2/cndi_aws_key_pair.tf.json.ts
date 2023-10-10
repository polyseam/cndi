import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSAwsKeyPairTFJSON(): string {
  const resource = getTFResource("aws_key_pair", {
    key_name: "cndi_aws_key_pair",
    public_key: "${tls_private_key.cndi_tls_private_key.public_key_openssh}",
  });
  return getPrettyJSONString(resource);
}
