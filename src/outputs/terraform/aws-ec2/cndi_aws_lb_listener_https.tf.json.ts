import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSLbListenerHTTPSTFJSON(): string {
  const resource = getTFResource("aws_lb_listener", {
    default_action: [
      {
        target_group_arn:
          "${aws_lb_target_group.cndi_aws_lb_target_group_https.arn}",
        type: "forward",
      },
    ],
    load_balancer_arn: "${aws_lb.cndi_aws_lb.arn}",
    port: 443,
    protocol: "TCP",
    tags: {
      Name: "HTTPSLBListener",
    },
  }, "cndi_aws_lb_listener_https");
  return getPrettyJSONString(resource);
}
