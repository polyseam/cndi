import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSLbTargetGroupHTTPSTFJSON(): string {
  const resource = getTFResource("aws_lb_target_group", {
    tags: {
      Name: "HTTPSLBTargetGroup",
      // CNDIProject: "${local.cndi_project_name}", TODO: uncomment or delete
    },
    port: 443,
    protocol: "TCP",
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_lb_target_group_https");
  return getPrettyJSONString(resource);
}
