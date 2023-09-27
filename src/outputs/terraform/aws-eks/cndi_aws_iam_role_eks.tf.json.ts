import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRoleEKSTFJSON(): string {
  const resource = getTFResource("aws_iam_role", {
    assume_role_policy:
      "${data.aws_iam_policy_document.cndi_aws_iam_policy_document_role_eks.json}",
    name_prefix: "EKS",
  }, "cndi_aws_iam_role_eks");
  return getPrettyJSONString(resource);
}
