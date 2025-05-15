import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { resolveCNDIPorts } from "src/utils.ts";

export default function (cndi_config: CNDIConfig) {
  const project_name = "${local.cndi_project_name}";
  const open_ports = resolveCNDIPorts(cndi_config);
  const target_groups: Record<string, any> = {};

  open_ports.forEach((port) => {
    target_groups[`cndi_aws_lb_target_group_${port.name}`] = {
      port: port.number,
      protocol: "TCP",
      vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
      tags: {
        Name: `cndi-lb-target-group_${port.name}_${project_name}`,
      },
    };
  });

  return getPrettyJSONString({
    resource: {
      aws_lb_target_group: target_groups,
    },
  });
}
