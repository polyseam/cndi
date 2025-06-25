import { getPrettyJSONString } from "src/utils.ts";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-vpc.git?ref=573f574c922782bc658f05523d0c902a4792b0a8";

export default function (_cndi_config: NormalizedCNDIConfig): string | null {
  return getPrettyJSONString({
    module: {
      cndi_aws_vpc_module: {
        azs: "${local.availability_zones}",
        cidr: "${local.network_address_space}",
        create_vpc: true,
        enable_dns_hostnames: true,
        enable_nat_gateway: true,
        name: "cndi-vpc_${local.cndi_project_name}",
        private_subnets: "${local.private_subnet_address_spaces}",
        public_subnets: "${local.public_subnet_address_spaces}",
        public_subnet_tags: {
          "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
          "kubernetes.io/role/elb": "1",
        },
        private_subnet_tags: {
          "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
          "kubernetes.io/role/internal-elb": "1",
        },
        single_nat_gateway: true,
        source: MODULE_SOURCE,
      },
    },
  });
}
