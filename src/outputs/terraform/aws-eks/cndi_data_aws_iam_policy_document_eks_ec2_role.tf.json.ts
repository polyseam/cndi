import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSIamPolicyDocumentEKSEC2DATATFJSON(): string {
  const data = getTFData("aws_iam_policy_document", {
    statement: [
      {
        actions: ["sts:AssumeRole"],
        effect: "Allow",
        principals: [
          { identifiers: ["eks.amazonaws.com"], type: "Service" },
          { identifiers: ["ec2.amazonaws.com"], type: "Service" },
        ],
      },
    ],
  }, "cndi_data_aws_iam_policy_document_eks_ec2_role");
  return getPrettyJSONString(data);
}
