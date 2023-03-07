import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSRouteTableTFJSON(): string {
  return getPrettyJSONString({
      resource: {
        aws_route_table: {
          cndi_aws_route_table: {
            tags: { Name: "RouteTable", CNDIProject: "${local.cndi_project_name}" },
            vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
          },
        },
      },
  });
}
