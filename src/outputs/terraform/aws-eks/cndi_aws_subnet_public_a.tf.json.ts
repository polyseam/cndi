import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSubnetPublicATFJSON(): string {
  const resource = getTFResource("aws_subnet", {
    availability_zone:
      "${data.aws_availability_zones.cndi_aws_availability_zones.names[0]}",
    cidr_block: "10.0.1.0/24",
    map_public_ip_on_launch: true,
    tags: {
      Name: "PublicSubnetA",
      CNDIProject: "${local.cndi_project_name}",
      "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
      "kubernetes.io/role/elb": 1,
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "aws_subnet.cndi_aws_subnet_public_a");
  return getPrettyJSONString(resource);
}
