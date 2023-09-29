import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEKSCNITFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    role: "${aws_iam_role.cndi_aws_iam_role_ec2.name}",
  }, "cndi_aws_iam_role_policy_attachment_eks_cni_policy");
  return getPrettyJSONString(resource);
}
