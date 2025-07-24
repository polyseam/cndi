import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { resolveCNDIPorts } from "src/utils.ts";

type AWSLBListener = {
  load_balancer_arn: string;
  port: number;
  protocol: string;
  default_action: {
    type: string;
    target_group_arn: string;
  }[];
  tags: {
    Name: string;
  };
};

type AWSLBTargetGroupAttachment = {
  target_group_arn: string;
  target_id: string;
  port: number;
};

export default function (cndi_config: NormalizedCNDIConfig) {
  const project_name = "${local.cndi_project_name}";
  const nodes = cndi_config.infrastructure.cndi.nodes;
  if (nodes === "auto") {
    throw new Error(
      "'auto' nodes are not supported in microk8s clusters",
    );
  }
  const open_ports = resolveCNDIPorts(cndi_config);
  const listeners: Record<string, AWSLBListener> = {};
  const attachments: Record<string, AWSLBTargetGroupAttachment> = {};

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
    nodes.forEach((node) => {
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
