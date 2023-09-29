import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEKSClusterTFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
    role: "${aws_iam_role.cndi_aws_iam_role_eks.name}",
  }, "cndi_aws_iam_role_policy_attachment_eks_cluster_policy");
  return getPrettyJSONString(resource);
}
