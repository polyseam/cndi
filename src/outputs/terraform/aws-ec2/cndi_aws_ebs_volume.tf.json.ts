import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";
import { DEFAULT_NODE_DISK_SIZE } from "constants";

export default function getAWSComputeInstanceTFJSON(
  node: AWSEC2NodeItemSpec,
): string {
  const { name } = node;
  const size = node?.volume_size || node?.disk_size || node?.size ||
    node?.disk_size_gb || DEFAULT_NODE_DISK_SIZE; // the size of the drive in GiBs.
  const type = "gp2"; // general purpose SSD
  const availability_zone = "${local.availability_zones[0]}"; // first availability zone in list

  const resource = getTFResource(
    "aws_ebs_volume",
    {
      size,
      type,
      availability_zone,
      tags: {
        Name: "EBSVolume",
        CNDIProject: "${local.cndi_project_name}",
      },
    },
    `cndi_aws_ebs_volume_${name}`,
  ).resource;

  return getPrettyJSONString({
    resource,
  });
}
