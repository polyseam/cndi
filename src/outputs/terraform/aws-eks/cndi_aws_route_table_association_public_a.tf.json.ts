import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSRouteTableAssociationPublicATFJSON(): string {
  const resource = getTFResource("aws_route_table_association", {
    route_table_id: "${aws_route_table.cndi_aws_route_table_public.id}",
    subnet_id: "${aws_subnet.cndi_aws_subnet_public_a.id}",
  }, "cndi_aws_route_table_association_public_a");
  return getPrettyJSONString(resource);
}
