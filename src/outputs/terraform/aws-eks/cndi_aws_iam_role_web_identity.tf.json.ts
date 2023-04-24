import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRoleWebIdentityTFJSON(): string {
  const resource = getTFResource("aws_iam_role", {
    assume_role_policy:
      "${data.aws_iam_policy_document.cndi_aws_iam_policy_document_web_identity_policy.json}",
    name: "cndi_aws_iam_role_web_identity_policy_role",
  }, "cndi_aws_iam_role_web_identity_policy");
  return getPrettyJSONString(resource);
}
