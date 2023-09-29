import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamRolePolicyAttachmentEKSVPCResourceControllerTFJSON(): string {
  const resource = getTFResource("aws_iam_role_policy_attachment", {
    policy_arn: "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController",
    role: "${aws_iam_role.cndi_aws_iam_role_ec2.name}",
  }, "cndi_aws_iam_role_policy_attachment_eks_vpc_resource_controller");
  return getPrettyJSONString(resource);
}
