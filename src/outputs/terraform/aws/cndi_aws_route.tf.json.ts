import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTFJSON(): string {
  const resource = getTFResource("aws_route", {
    depends_on: ["aws_route_table.cndi_aws_route_table"],
    route_table_id: "${aws_route_table.cndi_aws_route_table.id}",
    destination_cidr_block: "0.0.0.0/0",
    gateway_id: "${aws_internet_gateway.cndi_aws_internet_gateway.id}",
  });
  return getPrettyJSONString(resource);
}
