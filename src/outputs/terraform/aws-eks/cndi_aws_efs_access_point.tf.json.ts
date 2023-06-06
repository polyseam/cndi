import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSEFSAccessPointTFJSON(): string {
  const resource = getTFResource("aws_efs_access_point", {
    file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
    tags: {
      Name: "ElasticFileSystemAccessPoint",
      // TODO: delete or uncomment CNDIProject: "${local.cndi_project_name}",
    },
  });
  return getPrettyJSONString(
    resource,
  );
}
