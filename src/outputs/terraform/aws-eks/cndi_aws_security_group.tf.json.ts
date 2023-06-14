import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSSecurityGroupTFJSON(): string {
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
    ingress: [
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
    ],
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
    tags: {
      Name: "SecurityGroup",
    },
  });
  return getPrettyJSONString(resource);
}
