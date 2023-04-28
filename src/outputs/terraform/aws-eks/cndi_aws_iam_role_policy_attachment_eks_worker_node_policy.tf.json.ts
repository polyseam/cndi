import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEKSWorkerNodeTFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    role: "${aws_iam_role.cndi_aws_iam_role_eks_ec2.name}",
  }, "cndi_aws_iam_role_policy_attachment_eks_worker_node_policy");
  return getPrettyJSONString(resource);
}
