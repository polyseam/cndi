import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTablePublicTFJSON(): string {
  const resource = getTFResource("aws_route_table", {
    tags: {
      Name: "RouteTablePublic",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  }, "cndi_aws_route_table_public");
  return getPrettyJSONString(resource);
}
