import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

import { ccolors } from "deps";

interface Azure_EFS_MOUNT_TARGET {
  file_system_id: string;
  security_groups: string[];
  subnet_id: string;
  count: string;
}

export default function (_cndi_config: CNDIConfig) {
  const azure_efs_mount_target: Record<string, Azure_EFS_MOUNT_TARGET> = {
    // Use count instead of for_each to create one mount target per subnet
    cndi_azure_efs_mount_target: {
      count: "${length(module.cndi_azure_vpc_module.private_subnets)}",
      file_system_id: "${azure_efs_file_system.cndi_azure_efs_file_system.id}",
      subnet_id:
        "${element(module.cndi_azure_vpc_module.private_subnets, count.index)}",
      security_groups: [
        "${module.cndi_azure_aks_module.cluster_primary_security_group_id}",
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
      azure_efs_mount_target,
    },
  });
}
