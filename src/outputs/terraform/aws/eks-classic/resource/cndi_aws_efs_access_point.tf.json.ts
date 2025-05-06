import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AwsEfsAccessPoint {
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
  const aws_efs_access_point: Record<string, AwsEfsAccessPoint> = {
    cndi_aws_efs_access_point: {
      file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
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
      aws_efs_access_point,
    },
  });
}
