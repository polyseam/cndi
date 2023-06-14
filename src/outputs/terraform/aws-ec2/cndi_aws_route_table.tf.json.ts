import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTableTFJSON(): string {
  const resource = getTFResource("aws_route_table", {
    tags: {
      Name: "RouteTable",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  });
  return getPrettyJSONString(resource);
}
