import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { resolveCNDIPorts } from "src/utils.ts";

export default function (cndi_config: CNDIConfig) {
  const project_name = "${local.cndi_project_name}";
  const open_ports = resolveCNDIPorts(cndi_config);

  const ingress_rules = [
    {
      cidr_blocks: ["10.0.0.0/16"],
      description:
        "Inbound rule that enables traffic between EC2 instances in the VPC",
      from_port: 0,
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      protocol: "-1",
      security_groups: [],
      self: false,
      to_port: 0,
    },
    ...open_ports.map((port) => ({
      cidr_blocks: ["0.0.0.0/0"],
      description: `Port for ${port.name} traffic`,
      from_port: port.number,
      ipv6_cidr_blocks: [],
      prefix_list_ids: [],
      protocol: "tcp",
      security_groups: [],
      self: false,
      to_port: port.number,
    })),
  ];

  return getPrettyJSONString({
    resource: {
      aws_security_group: {
        cndi_aws_security_group: {
          description: "Security firewall",
          vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
          ingress: ingress_rules,
          egress: [
            {
              cidr_blocks: ["0.0.0.0/0"],
              description: "All traffic",
              from_port: 0,
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              protocol: "-1",
              security_groups: [],
              to_port: 0,
            },
          ],
          tags: {
            Name: `CNDISecurityGroup_${project_name}`,
          },
        },
      },
    },
  });
}
