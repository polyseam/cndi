import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSubnetPrivateATFJSON(): string {
  const resource = getTFResource("aws_subnet", {
    availability_zone:
      "${local.availability_zones[0]}",
    cidr_block: "10.0.3.0/24",
    tags: {
      Name: "PrivateSubnet",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_subnet_private");
  return getPrettyJSONString(resource);
}
