import { getPrettyJSONString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";

const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-vpc.git?ref=573f574c922782bc658f05523d0c902a4792b0a8";

export default function (_cndi_config: CNDIConfig): string | null {
  return getPrettyJSONString({
    module: {
      cndi_aws_vpc_module: {
        azs: "${local.azs}",
        cidr: "${local.vnet_cidr}",
        create_vpc: true,
        enable_dns_hostnames: true,
        enable_nat_gateway: true,
        name: "cndi-vpc_${local.cndi_project_name}",
        private_subnet_tags: {
          "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
          "kubernetes.io/role/internal-elb": "1",
        },
        private_subnets:
          "${[for k, v in local.azs : cidrsubnet(local.vnet_cidr, 4, k)]}",
        public_subnet_tags: {
          "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
          "kubernetes.io/role/elb": "1",
        },
        public_subnets:
          "${[for k, v in local.azs : cidrsubnet(local.vnet_cidr, 8, k)]}",
        single_nat_gateway: true,
        source: MODULE_SOURCE,
      },
    },
  });
}
