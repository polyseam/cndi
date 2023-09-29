import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEKSServiceTFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
    role: "${aws_iam_role.cndi_aws_iam_role_eks.name}",
  }, "cndi_aws_iam_role_policy_attachment_eks_service_policy");
  return getPrettyJSONString(resource);
}
