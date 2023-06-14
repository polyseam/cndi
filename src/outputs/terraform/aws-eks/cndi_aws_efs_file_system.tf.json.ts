import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSEFSFileSystemTFJSON(): string {
  const resource = getTFResource("aws_efs_file_system", {
    creation_token: "cndi_aws_efs_${local.cndi_project_name}_token",
    tags: {
      Name: "ElasticFileSystem",
    },
  });
  return getPrettyJSONString(resource);
}
