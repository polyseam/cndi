import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRoleEC2TFJSON(): string {
  const resource = getTFResource("aws_iam_role", {
    assume_role_policy:
      "${data.aws_iam_policy_document.cndi_aws_iam_policy_document_role_ec2.json}",
    name_prefix: "EC2",
  }, "cndi_aws_iam_role_ec2");
  return getPrettyJSONString(resource);
}
