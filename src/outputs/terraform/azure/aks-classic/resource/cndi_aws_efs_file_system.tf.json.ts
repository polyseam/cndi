import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface Azure_EFS_FILE_SYSTEM {
  creation_token: string;
  encrypted: boolean;
  tags: Record<string, string>;
}

export default function (cndi_config: CNDIConfig) {
  const azure_efs_file_system: Record<string, Azure_EFS_FILE_SYSTEM> = {
    cndi_azure_efs_file_system: {
      creation_token: "cndi-elastic-file-system_${local.cndi_project_name}",
      encrypted: true,
      tags: {
        Name: "cndi-efs-access-point_${local.cndi_project_name}", // may fuss
        CNDIProject: cndi_config.project_name!,
      },
    },
  };

  return getPrettyJSONString({
    resource: {
      azure_efs_file_system,
    },
  });
}
