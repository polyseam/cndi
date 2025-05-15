import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AwsIamPolicy {
  policy: string;
}

export default function (_cndi_config: CNDIConfig) {
  const aws_iam_policy: Record<string, AwsIamPolicy> = {
    cndi_aws_iam_policy: {
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Resource: "*",
          Effect: "Allow",
          Action: [
            "ec2:CreateVolume",
            "ec2:AttachVolume",
            "ec2:DetachVolume",
            "ec2:ModifyVolume",
            "ec2:DeleteVolume",
            "ec2:DescribeVolumes",
            "ec2:DescribeVolumeStatus",
            "ec2:DescribeTags",
            "ec2:CreateTags",
            "ec2:DeleteTags",
            "ec2:CreateSnapshot",
            "ec2:DeleteSnapshot",
            "ec2:DescribeSnapshots",
            "ec2:ModifySnapshotAttribute",
            "ec2:CopySnapshot",
            "ec2:CreateTags",
            "ec2:DescribeTags",
            "ec2:DescribeAvailabilityZones",
            "ec2:CreateSnapshot",
            "ec2:AttachVolume",
            "ec2:DetachVolume",
            "ec2:ModifyVolume",
            "ec2:DescribeInstances",
            "ec2:DescribeVolumesModifications",
            "elasticfilesystem:CreateAccessPoint",
            "elasticfilesystem:DeleteAccessPoint",
            "elasticfilesystem:DescribeAccessPoints",
            "elasticfilesystem:CreateFileSystem",
            "elasticfilesystem:DeleteFileSystem",
            "elasticfilesystem:DescribeFileSystems",
            "elasticfilesystem:CreateMountTarget",
            "elasticfilesystem:DeleteMountTarget",
            "elasticfilesystem:DescribeMountTargets",
            "elasticfilesystem:ModifyMountTargetSecurityGroups",
            "elasticfilesystem:DescribeMountTargetSecurityGroups",
            "elasticfilesystem:TagResource",
            "elasticfilesystem:ClientWrite",
            "elasticfilesystem:DescribeTags",
          ],
        }],
      }),
    },
  };

  return getPrettyJSONString({
    resource: {
      aws_iam_policy,
    },
  });
}
