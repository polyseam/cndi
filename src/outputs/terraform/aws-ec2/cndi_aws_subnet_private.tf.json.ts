import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSubnetPrivateATFJSON(): string {
  const resource = getTFResource("aws_subnet", {
    availability_zone:
      "${data.aws_availability_zones.cndi_aws_availability_zones.names[0]}",
    cidr_block: "10.0.3.0/24",
    map_public_ip_on_launch: true,
    tags: {
      Name: "PrivateSubnet",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_subnet_private");
  return getPrettyJSONString(resource);
}
