import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamPolicyWebIdentityTFJSON(): string {
  const resource = getTFResource("aws_iam_policy", {
    name_prefix: "WEBIDP",
    policy:
      "${data.aws_iam_policy_document.cndi_aws_iam_policy_document_permissions.json}",
  }, "cndi_aws_iam_policy_web_identity_policy");
  return getPrettyJSONString(resource);
}
