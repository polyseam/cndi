import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSEFSTFJSON(): string {
  const resource = getTFResource("aws_efs_file_system", {
    creation_token: "cndi_aws_efs_file_system_token",
    tags: {
      Name: "ElasticFileSystem",
      CNDIProject: "${local.cndi_project_name}",
    },
  });
  return getPrettyJSONString(
    resource,
  );
}
