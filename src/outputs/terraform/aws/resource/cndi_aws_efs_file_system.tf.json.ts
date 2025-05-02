import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AWS_EFS_FILE_SYSTEM {
  creation_token: string;
  encrypted: boolean;
  tags: Record<string, string>;
}

export default function (cndi_config: CNDIConfig) {
  const aws_efs_file_system: Record<string, AWS_EFS_FILE_SYSTEM> = {
    cndi_aws_efs_file_system: {
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
      aws_efs_file_system,
    },
  });
}
