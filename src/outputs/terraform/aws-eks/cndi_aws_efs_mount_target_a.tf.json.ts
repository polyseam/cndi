import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSElasticFileSystemMountTargetATFJSON(): string {
  const resource = getTFResource("aws_efs_mount_target", {
    file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
    security_groups: ["${aws_security_group.cndi_aws_security_group.id}"],
    subnet_id: "${aws_subnet.cndi_aws_subnet_private_a.id}",
  }, "cndi_aws_efs_mount_target_a");
  return getPrettyJSONString(resource);
}
