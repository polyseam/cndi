import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSLbTargetGroupHTTPSTFJSON(): string {
  const resource = getTFResource("aws_lb_target_group", {
    tags: {
      Name: "HTTPSLBTargetGroup",
      CNDIProject: "${local.cndi_project_name}",
    },
    port: 443,
    protocol: "TCP",
    vpc_id: "${aws_vpc.vpc.id}",
  }, "cndi_aws_lb_target_group_https");
  return getPrettyJSONString(resource);
}
