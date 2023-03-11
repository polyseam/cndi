import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTableAssociationTFJSON(): string {
  const resource = getTFResource("aws_route_table_association", {
    count: "1",
    route_table_id: "${aws_route_table.cndi_aws_route_table.id}",
    subnet_id: "${element(aws_subnet.cndi_aws_subnet[*].id, count.index)}",
  });
  return getPrettyJSONString(resource);
}
