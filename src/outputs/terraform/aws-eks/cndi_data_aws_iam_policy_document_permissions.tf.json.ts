import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSIamPolicyDocumentPermissionsDataTFJSON(): string {
  const data = getTFData("aws_iam_policy_document", {
    statement: [
      {
        actions: [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:AttachVolume",
          "ec2:CreateSnapshot",
          "ec2:CreateTags",
          "ec2:CreateVolume",
          "ec2:DeleteSnapshot",
          "ec2:DeleteTags",
          "ec2:DeleteVolume",
          "ec2:DescribeInstances",
          "ec2:DescribeSnapshots",
          "ec2:DescribeTags",
          "ec2:DescribeVolumes",
          "ec2:DetachVolume",
          "elasticfilesystem:DescribeAccessPoints",
          "elasticfilesystem:DescribeFileSystems",
          "elasticfilesystem:DescribeMountTargets",
          "ec2:DescribeAvailabilityZones",
        ],
        effect: "Allow",
        resources: ["*"],
      },
      {
        actions: ["elasticfilesystem:CreateAccessPoint"],
        condition: [
          {
            test: "StringLike",
            values: ["true"],
            variable: "aws:RequestTag/efs.csi.aws.com/cluster",
          },
        ],
        effect: "Allow",
        resources: ["*"],
      },
      {
        actions: ["elasticfilesystem:TagResource"],
        condition: [
          {
            test: "StringLike",
            values: ["true"],
            variable: "aws:ResourceTag/efs.csi.aws.com/cluster",
          },
        ],
        effect: "Allow",
        resources: ["*"],
      },
      {
        actions: ["elasticfilesystem:DeleteAccessPoint"],
        condition: [
          {
            test: "StringEquals",
            values: ["true"],
            variable: "aws:ResourceTag/efs.csi.aws.com/cluster",
          },
        ],
        effect: "Allow",
        resources: ["*"],
      },
    ],
  }, "cndi_data_aws_iam_policy_document_permissions");
  return getPrettyJSONString(data);
}
