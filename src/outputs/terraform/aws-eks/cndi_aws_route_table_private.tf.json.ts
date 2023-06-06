import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTablePrivateTFJSON(): string {
  const resource = getTFResource("aws_route_table", {
    tags: {
      Name: "RouteTablePrivate",
      // TODO: delete or uncomment CNDIProject: "${local.cndi_project_name}",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_route_table_private");
  return getPrettyJSONString(resource);
}
