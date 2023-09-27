import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRoleEKSEC2TFJSON(): string {
  const resource = getTFResource("aws_iam_role", {
    assume_role_policy:
      '${jsonencode({Version ="2012-10-17",Statement=[{Action="sts:AssumeRole",Effect= "Allow",Principal{Service="ec2.amazonaws.com"}}]})}',
    name: "ec2",
  }, "cndi_aws_iam_role_ec2");
  return getPrettyJSONString(resource);
}
