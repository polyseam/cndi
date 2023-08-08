import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSubnetPublicATFJSON(): string {
  const resource = getTFResource("aws_subnet", {
    availability_zone:
      "${local.availability_zones[0]}",
    cidr_block: "10.0.1.0/24",
    map_public_ip_on_launch: true,
    tags: {
      Name: "PublicSubnet",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_subnet_public");
  return getPrettyJSONString(resource);
}
