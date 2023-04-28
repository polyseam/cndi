import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEC2ContainerRegistryReadOnlyTFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    role: "${aws_iam_role.cndi_aws_iam_role_eks_ec2.name}",
  }, "cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly");
  return getPrettyJSONString(resource);
}
