import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSLbListenerTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      aws_lb_listener: {
        "cndi_aws_lb_listener_https": [
          {
            default_action: [
              {
                target_group_arn: "${aws_lb_target_group.cndi_aws_lb_target_group_https.arn}",
                type: "forward",
              },
            ],
            load_balancer_arn: "${aws_lb.cndi_aws_lb.arn}",
            port: 443,
            protocol: "TCP",
            tags: {
              Name: "HTTPSLBListener",
              CNDIProject: "${local.cndi_project_name}",
            },
          },
        ],
      },
    },

  });
}
