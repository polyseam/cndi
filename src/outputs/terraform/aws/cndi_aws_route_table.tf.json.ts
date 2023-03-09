import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTableTFJSON(): string {
  const resource = getTFResource("aws_route_table", {
    tags: {
      Name: "RouteTable",
      CNDIProject: "${local.cndi_project_name}",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  });
  return getPrettyJSONString(resource);
}
