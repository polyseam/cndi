import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTableAssociationPrivateBTFJSON(): string {
  const resource = getTFResource("aws_route_table_association", {
    route_table_id: "${aws_route_table.cndi_aws_route_table_private.id}",
    subnet_id: "${aws_subnet.cndi_aws_subnet_private_b.id}",
  }, "cndi_aws_route_table_association_private_b");
  return getPrettyJSONString(resource);
}
