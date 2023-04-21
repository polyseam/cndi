import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSIamPolicyDocumentWebIdentityDataTFJSON(): string {
  const data = getTFData("aws_iam_policy_document", {
    depends_on: [
      "aws_iam_openid_connect_provider.cndi_aws_iam_openid_connect_provider",
    ],
    statement: [
      {
        actions: ["sts:AssumeRoleWithWebIdentity"],
        condition: [
          {
            test: "StringEquals",
            values: [
              "system:serviceaccount:kube-system:efs-csi-controller-sa",
              "system:serviceaccount:kube-system:ebs-csi-controller-sa",
            ],
            variable:
              '${replace(aws_iam_openid_connect_provider.cndi_aws_iam_openid_connect_provider.url, "https://", "")}:sub',
          },
        ],
        effect: "Allow",
        principals: [
          {
            identifiers: [
              "${aws_iam_openid_connect_provider.cndi_aws_iam_openid_connect_provider.arn}",
            ],
            type: "Federated",
          },
        ],
      },
    ],
  }, "cndi_data_aws_iam_policy_document_web_identity");
  return getPrettyJSONString(data);
}
