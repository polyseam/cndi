import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface Azure_EFS_ACCESS_POINT {
  file_system_id: string;
  posix_user: {
    gid: number;
    uid: number;
  };
  root_directory: {
    path: string;
  };
  tags: Record<string, string>;
}

export default function (cndi_config: CNDIConfig) {
  const azure_efs_access_point: Record<string, Azure_EFS_ACCESS_POINT> = {
    cndi_azure_efs_access_point: {
      file_system_id: "${azure_efs_file_system.cndi_azure_efs_file_system.id}",
      posix_user: {
        gid: 1000,
        uid: 1000,
      },
      root_directory: {
        path: "/efs",
      },
      tags: {
        Name: "cndi-efs-access-point",
        CNDIProject: cndi_config.project_name!,
      },
    },
  };

  return getPrettyJSONString({
    resource: {
      azure_efs_access_point,
    },
  });
}
