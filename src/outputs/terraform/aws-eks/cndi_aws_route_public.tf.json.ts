import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRoutePublicTFJSON(): string {
  const resource = getTFResource("aws_route", {
    route_table_id: "${aws_route_table.cndi_aws_route_table_public.id}",
    destination_cidr_block: "0.0.0.0/0",
    gateway_id: "${aws_internet_gateway.cndi_aws_internet_gateway.id}",
  }, "cndi_aws_route_public");
  return getPrettyJSONString(resource);
}
