import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

export default function getAWSLbTargetGroupForPortTFJSON(
  port: CNDIPort,
): string {
  const { name, number } = port;
  const resource = getTFResource("aws_lb_target_group", {
    tags: {
      Name: `UserPortLBTargetGroup-${name}`,
      // CNDIProject: "${local.cndi_project_name}", TODO: uncomment or delete
    },
    port: number,
    protocol: "TCP",
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, `cndi_aws_lb_target_group_${name}`);
  return getPrettyJSONString(resource);
}
