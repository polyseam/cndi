import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEKSWorkerNodeTFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "${aws_iam_policy.cndi_aws_iam_policy_web_identity_policy.arn}",
    role: "${aws_iam_role.cndi_aws_iam_role_web_identity_policy.name}",
  }, "cndi_aws_iam_role_policy_attachment_web_identity_policy");
  return getPrettyJSONString(resource);
}
