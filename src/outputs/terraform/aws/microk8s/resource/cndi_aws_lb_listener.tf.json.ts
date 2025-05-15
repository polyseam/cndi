import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { resolveCNDIPorts } from "src/utils.ts";

export default function (cndi_config: CNDIConfig) {
  const project_name = "${local.cndi_project_name}";
  const open_ports = resolveCNDIPorts(cndi_config);
  const listeners: Record<string, any> = {};
  const attachments: Record<string, any> = {};

  open_ports.forEach((port) => {
    listeners[`cndi_aws_lb_listener_${port.name}`] = {
      load_balancer_arn: "${aws_lb.cndi_aws_lb.arn}",
      port: port.number,
      protocol: "TCP",
      default_action: [
        {
          type: "forward",
          target_group_arn: "${aws_lb_target_group.cndi_aws_lb_target_group_" +
            port.name + ".arn}",
        },
      ],
      tags: {
        Name: `cndi-lb-listener_for_${port.name}_${project_name}`,
      },
    };

    // Add target group attachments for each node
    cndi_config.infrastructure.cndi.nodes.forEach((node) => {
      const count = node?.count || 1;
      for (let i = 0; i < count; i++) {
        const nodeName = `${node.name}-${i}`;
        attachments[
          `cndi_aws_lb_target_group_attachment_${port.name}_${nodeName}`
        ] = {
          target_group_arn: "${aws_lb_target_group.cndi_aws_lb_target_group_" +
            port.name + ".arn}",
          target_id: "${aws_instance.cndi_aws_instance_" + nodeName + ".id}",
          port: port.number,
        };
      }
    });
  });

  return getPrettyJSONString({
    resource: {
      aws_lb_listener: listeners,
      aws_lb_target_group_attachment: attachments,
    },
  });
}
