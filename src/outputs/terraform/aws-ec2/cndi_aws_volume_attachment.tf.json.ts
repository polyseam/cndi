import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";

export default function getAWSComputeInstanceTFJSON(
  node: AWSEC2NodeItemSpec,
): string {
  const { name } = node;
  const instance_id = `\${aws_instance.cndi_aws_instance_${name}.id}`; // ID of the Instance to attach to
  const volume_id = `$\{aws_ebs_volume.cndi_aws_ebs_volume_${name}.id}`; // ID of the Volume to be attached
  const device_name = "/dev/sdf"; // The device name to expose to the instance
  const resource = getTFResource(
    "aws_volume_attachment",
    {
      instance_id,
      volume_id,
      device_name,
    },
    `cndi_aws_volume_attachment_${name}`,
  ).resource;

  return getPrettyJSONString({
    resource,
  });
}
