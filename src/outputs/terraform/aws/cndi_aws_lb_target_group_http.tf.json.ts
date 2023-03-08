import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSLbTargetGroupHTTPTFJSON(): string {
  const resource = getTFResource("aws_lb_target_group",
    {
      tags: {
        Name: "HTTPLBTargetGroup",
        CNDIProject: "${local.cndi_project_name}",
      },
      port: 80,
      protocol: "TCP",
      vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
    },
    'cndi_aws_lb_target_group_http'
  );
  return getPrettyJSONString(resource);
}
