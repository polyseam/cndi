import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

export default function getAWSSecurityGroupTFJSON(ports: CNDIPort[]): string {
  const ingress = [
    {
      cidr_blocks: ["10.0.0.0/16"],
      description:
        "Inbound rule that enables traffic between EC2 instances in the VPC ",
      from_port: "0",
      protocol: "-1",
      to_port: "0",
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      security_groups: [],
      self: false,
    },
  ];

  ports.forEach((port) => {
    const { number, name } = port;

    ingress.push({
      cidr_blocks: ["0.0.0.0/0"],
      description: `Port for ${name} traffic`,
      from_port: `${number}`,
      protocol: "tcp",
      to_port: `${number}`,
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      security_groups: [],
      self: false,
    });
  });

  const resource = getTFResource("aws_security_group", {
    description: "VPC Security firewall",
    egress: [
      {
        cidr_blocks: ["0.0.0.0/0"],
        description: "All traffic",
        from_port: "0",
        ipv6_cidr_blocks: [],
        prefix_list_ids: [],
        protocol: "-1",
        security_groups: [],
        self: false,
        to_port: "0",
      },
    ],
    ingress,
    vpc_id: "${module.cndi_aws_vpc.vpc_id}",
    tags: {
      Name: "SecurityGroup",
    },
  });
  return getPrettyJSONString(resource);
}
