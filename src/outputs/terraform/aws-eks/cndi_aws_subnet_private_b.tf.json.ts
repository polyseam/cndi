import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSubnetPrivateBTFJSON(): string {
  const resource = getTFResource("aws_subnet", {
    availability_zone:
      "${data.aws_availability_zones.cndi_aws_availability_zones.names[1]}",
    cidr_block: "10.0.4.0/24",
    map_public_ip_on_launch: true,
    tags: {
      Name: "PrivateSubnetB",
      CNDIProject: "${local.cndi_project_name}",
      "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
      "kubernetes.io/role/internal-elb": 1,
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_subnet_private_b");
  return getPrettyJSONString(resource);
}
