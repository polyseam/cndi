import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

import { ccolors } from "deps";

interface AWS_EFS_MOUNT_TARGET {
  file_system_id: string;
  security_groups: string[];
  subnet_id: string;
  for_each: string;
}

export default function (_cndi_config: CNDIConfig) {
  const aws_efs_mount_target: Record<string, AWS_EFS_MOUNT_TARGET> = {
    // loop over each subnet ID in vpc
    cndi_aws_efs_mount_target: {
      for_each: "${toset(module.cndi_aws_vpc_module.private_subnets)}",
      file_system_id: "${aws_efs_file_system.fs.id}",
      subnet_id: "${each.value}",
      security_groups: [
        "${module.cndi_aws_eks_module.cluster_primary_security_group_id}",
      ],
    },
  };

  console.warn(
    ccolors.warn("EFS Mount Targets are being looped in Terraform!"),
  );

  return getPrettyJSONString({
    resource: {
      aws_efs_mount_target,
    },
  });
}
