import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSubnetTFJSON(): string {
  const resource = getTFResource("aws_subnet", {
    count: "1",
    availability_zone: "${element(local.availability_zones, count.index)}",
    cidr_block: "10.0.1.0/24",
    map_public_ip_on_launch: true,
    tags: { Name: "Subnet", CNDIProject: "${local.cndi_project_name}" },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  });
  return getPrettyJSONString(resource);
}
