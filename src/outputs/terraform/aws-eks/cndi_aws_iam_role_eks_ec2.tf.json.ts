import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRoleEKSEC2TFJSON(): string {
  const resource = getTFResource("aws_iam_role", {
    assume_role_policy:
      "${data.aws_iam_policy_document.cndi_aws_iam_policy_document_eks_ec2_role.json}",
    name_prefix: "EC2EKS",
  }, "cndi_aws_iam_role_eks_ec2");
  return getPrettyJSONString(resource);
}
