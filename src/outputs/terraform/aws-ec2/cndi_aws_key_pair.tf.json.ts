import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSAwsKeyPairTFJSON(): string {
  const resource = getTFResource("aws_key_pair", {
    key_name: "cndi_aws_key_pair",
    public_key: "${var.ssh_access_public_key}",
  });
  return getPrettyJSONString(resource);
}
