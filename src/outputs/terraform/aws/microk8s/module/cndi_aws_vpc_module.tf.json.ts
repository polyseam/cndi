import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const project_name = "${local.cndi_project_name}";

  return getPrettyJSONString({
    resource: {
      aws_vpc: {
        cndi_aws_vpc: {
          cidr_block: "10.0.0.0/16",
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: {
            Name: `CNDIVPC_${project_name}`,
          },
        },
      },
      aws_internet_gateway: {
        cndi_aws_internet_gateway: {
          tags: {
            Name: `CNDIInternetGateway_${project_name}`,
          },
          vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
        },
      },
      aws_subnet: {
        cndi_aws_subnet: {
          availability_zone:
            "${data.aws_availability_zones.available-zones.names[0]}",
          cidr_block: "10.0.1.0/24",
          map_public_ip_on_launch: true,
          tags: {
            Name: `CNDIPrimarySubnet_${project_name}`,
          },
          vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
        },
      },
      aws_route_table: {
        cndi_aws_route_table: {
          tags: {
            Name: `CNDIRouteTable_${project_name}`,
          },
          vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
        },
      },
      aws_route_table_association: {
        cndi_aws_route_table_association: {
          route_table_id: "${aws_route_table.cndi_aws_route_table.id}",
          subnet_id: "${aws_subnet.cndi_aws_subnet.id}",
        },
      },
      aws_route: {
        cndi_aws_route: {
          route_table_id: "${aws_route_table.cndi_aws_route_table.id}",
          destination_cidr_block: "0.0.0.0/0",
          gateway_id: "${aws_internet_gateway.cndi_aws_internet_gateway.id}",
          depends_on: ["aws_route_table.cndi_aws_route_table"],
        },
      },
    },
  });
}
