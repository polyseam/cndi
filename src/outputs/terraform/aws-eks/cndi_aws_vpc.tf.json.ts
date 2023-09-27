import { getPrettyJSONString, getTFModule } from "src/utils.ts";

export default function getAWSVPCTFJSON(): string {
  const module = getTFModule("aws_vpc", {
    azs: "slice(data.aws_availability_zones.available.names, 0, 3)",
    cidr: "10.0.0.0/16",
    enable_dns_hostnames: true,
    enable_nat_gateway: true,
    name: "VPC",
    private_subnet_tags: [
      {
        "kubernetes.io/cluster/${local.cndi_project_name}": "shared",
        "kubernetes.io/role/internal-elb": 1,
      },
    ],
    private_subnets: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
    public_subnet_tags: [
      {
        "kubernetes.io/cluster/${local.cndi_project_name}": "shared",
        "kubernetes.io/role/elb": 1,
      },
    ],
    public_subnets: ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"],
    single_nat_gateway: true,
    source: "terraform-aws-modules/vpc/aws",
    version: "5.1.2",
  });
  return getPrettyJSONString(module);
}
