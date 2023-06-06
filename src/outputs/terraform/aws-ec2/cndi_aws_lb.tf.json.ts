import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSLbTFJSON(): string {
  const resource = getTFResource("aws_lb", {
    internal: false,
    load_balancer_type: "network",
    subnets: "${aws_subnet.cndi_aws_subnet[*].id}",
    tags: {
      Name: "NetworkLB",
      // TODO: uncomment or delete CNDIProject: "${local.cndi_project_name}",
    },
  });
  return getPrettyJSONString(resource);
}
