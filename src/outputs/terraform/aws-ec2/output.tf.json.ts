import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSLBDNSTFJSON(): string {
  return getPrettyJSONString({
    output: {
      aws_load_balancer_dns_name: {
        value: "${aws_lb.cndi_aws_lb.dns_name}",
      },
    },
  });
}
