import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

import {
  divideCIDRIntoSubnets,
  parseNetworkConfig,
} from "src/outputs/terraform/network-utils.ts";

import { ccolors } from "deps";

const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-vpc.git?ref=573f574c922782bc658f05523d0c902a4792b0a8";

export default function (cndi_config: CNDIConfig): string | null {
  const network = parseNetworkConfig(cndi_config);
  const subnets = divideCIDRIntoSubnets(network.vnet_address_space, 6);
  const private_subnets = subnets.slice(0, 3);
  const public_subnets = subnets.slice(3, 6);

  if (network.mode === "create") {
    return getPrettyJSONString({
      module: {
        cndi_aws_vpc_module: {
          azs: "${data.aws_availability_zones.available-zones.names}",
          cidr: "10.0.0.0/16",
          create_vpc: true,
          enable_dns_hostnames: true,
          enable_nat_gateway: true,
          name: "cndi-vpc_${local.cndi_project_name}",
          private_subnet_tags: {
            "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
            "kubernetes.io/role/internal-elb": "1",
          },
          private_subnets,
          public_subnet_tags: {
            "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
            "kubernetes.io/role/elb": "1",
          },
          public_subnets,
          single_nat_gateway: true,
          source: MODULE_SOURCE,
        },
      },
    });
  } else if (network.mode === "insert") {
    console.warn(ccolors.warn("create_vpc: false"));
    console.warn("cndi previously just ignored the vpc module on insert");
    return getPrettyJSONString({
      module: {
        cndi_aws_vpc_module: {
          create_vpc: false,
          tags: {
            CNDIProject: "${local.cndi_project_name}",
          },
          source: MODULE_SOURCE,
        },
      },
    });
  }

  throw new Error('Invalid network mode. Must be "create" or "insert".');
}
