import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRoutePrivateTFJSON(): string {
  const resource = getTFResource("aws_route", {
    route_table_id: "${aws_route_table.cndi_aws_route_table_private.id}",
    destination_cidr_block: "0.0.0.0/0",
    nat_gateway_id: "${aws_nat_gateway.cndi_aws_nat_gateway.id}",
  }, "cndi_aws_route_private");
  return getPrettyJSONString(resource);
}
