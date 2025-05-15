import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

import { ccolors } from "deps";

interface AwsEfsMountTarget {
  file_system_id: string;
  security_groups: string[];
  subnet_id: string;
  count: string;
}

export default function (_cndi_config: CNDIConfig) {
  const aws_efs_mount_target: Record<string, AwsEfsMountTarget> = {
    // Use count instead of for_each to create one mount target per subnet
    cndi_aws_efs_mount_target: {
      count: "${length(local.subnet_identifiers)}",
      file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
      subnet_id: "${element(local.subnet_identifiers, count.index)}",
      security_groups: [
        "${module.cndi_aws_eks_module.cluster_primary_security_group_id}",
      ],
    },
  };

  console.warn(
    ccolors.warn(
      "EFS Mount Targets are being created for each subnet using count!",
    ),
  );

  return getPrettyJSONString({
    resource: {
      aws_efs_mount_target,
    },
  });
}
