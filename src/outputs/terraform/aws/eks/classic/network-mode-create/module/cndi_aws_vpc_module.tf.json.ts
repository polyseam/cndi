import { getPrettyJSONString } from "src/utils.ts";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-vpc.git?ref=573f574c922782bc658f05523d0c902a4792b0a8";

export default function (_cndi_config: NormalizedCNDIConfig): string | null {
  return getPrettyJSONString({
    module: {
      cndi_aws_vpc_module: {
        azs: "${local.azs}",
        cidr: "${local.vnet_cidr}",
        create_vpc: true,
        enable_dns_hostnames: true,
        enable_nat_gateway: true,
        name: "cndi-vpc_${local.cndi_project_name}",
        private_subnets:
          "${[for k, v in local.azs : cidrsubnet(local.vnet_cidr, 4, k)]}",
        public_subnets:
          "${[for k, v in local.azs : cidrsubnet(local.vnet_cidr, 4, k + length(local.azs))]}",
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
