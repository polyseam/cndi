import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

export default function getAWSSecurityGroupTFJSON(
  ports: Array<CNDIPort>,
): string {
  const ingress = [
    {
      cidr_blocks: ["0.0.0.0/0"],
      description: "SSH port to access EC2 instances",
      from_port: "22",
      protocol: "tcp",
      to_port: "22",
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      security_groups: [],
      self: false,
    },
    {
      cidr_blocks: ["0.0.0.0/0"],
      description: "Port for HTTP traffic",
      from_port: "80",
      protocol: "tcp",
      to_port: "80",
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      security_groups: [],
      self: false,
    },
    {
      cidr_blocks: ["0.0.0.0/0"],
      description: "Port for HTTPS traffic",
      from_port: "443",
      protocol: "tcp",
      to_port: "443",
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      security_groups: [],
      self: false,
    },
    {
      cidr_blocks: ["0.0.0.0/0"],
      description:
        "Kubernetes API server port to access cluster from local machine",
      from_port: "16443",
      protocol: "tcp",
      to_port: "16443",
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      security_groups: [],
      self: false,
    },
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
    const { number, name, disable } = port;
    if (disable) {
      const portToRemove = ingress.findIndex((item) =>
        item.from_port === `${number}`
      );
      if (portToRemove > -1) {
        ingress.splice(portToRemove, 1);
      }
    } else {
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
    }
  });

  const resource = getTFResource("aws_security_group", {
    description: "Security firewall",
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
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
    tags: {
      Name: "SecurityGroup",
      CNDIProject: "${local.cndi_project_name}",
    },
  });
  return getPrettyJSONString(resource);
}
