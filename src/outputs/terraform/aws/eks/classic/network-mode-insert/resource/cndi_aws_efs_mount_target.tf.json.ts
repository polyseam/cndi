import { getPrettyJSONString } from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

interface AwsEfsMountTarget {
  file_system_id: string;
  security_groups: string[];
  subnet_id: string;
  count: string;
}

export default function (_cndi_config: NormalizedCNDIConfig) {
  const aws_efs_mount_target: Record<string, AwsEfsMountTarget> = {
    // Use count instead of for_each to create one mount target per subnet
    cndi_aws_efs_mount_target: {
      count: "${length(local.private_subnet_ids)}",
      file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
      subnet_id: "${element(local.private_subnet_ids, count.index)}",
      security_groups: [
        "${module.cndi_aws_eks_module.cluster_primary_security_group_id}",
      ],
    },
  };

  return getPrettyJSONString({
    resource: {
      aws_efs_mount_target,
    },
  });
}
