import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRoleEKSEC2TFJSON(): string {
  const resource = getTFResource("aws_iam_role", {
    assume_role_policy:
      '${jsonencode({Version ="2012-10-17",Statement=[{Action="sts:AssumeRole",Effect= "Allow",Principal{Service="eks.amazonaws.com"}}]})}',
    name: "eks",
  }, "cndi_aws_iam_role_eks");
  return getPrettyJSONString(resource);
}
