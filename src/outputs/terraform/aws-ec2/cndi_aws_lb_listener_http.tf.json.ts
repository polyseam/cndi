import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSLbListenerHTTPTFJSON(): string {
  const resource = getTFResource("aws_lb_listener", {
    default_action: [
      {
        target_group_arn:
          "${aws_lb_target_group.cndi_aws_lb_target_group_http.arn}",
        type: "forward",
      },
    ],
    tags: {
      Name: "HTTPLBListener",
      // CNDIProject: "${local.cndi_project_name}", TODO: uncomment or delete
    },
    load_balancer_arn: "${aws_lb.cndi_aws_lb.arn}",
    port: 80,
    protocol: "TCP",
  }, "cndi_aws_lb_listener_http");
  return getPrettyJSONString(resource);
}
