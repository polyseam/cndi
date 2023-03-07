import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSSubnetTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      aws_subnet: {
        cndi_aws_subnet: {
          count: "1",
          availability_zone: "${element(local.availability_zones, count.index)}",
          cidr_block: "10.0.1.0/24",
          map_public_ip_on_launch: true,
          tags: { Name: "Subnet", CNDIProject: "${local.cndi_project_name}" },
          vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
        },
      },
    },
  });
}
