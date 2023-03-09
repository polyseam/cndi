import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSInternetGatewayTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      aws_internet_gateway: {
        cndi_aws_internet_gateway: {
          tags: {
            Name: "InternetGateway",
            CNDIProject: "${local.cndi_project_name}",
          },
          vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
        },
      },
    },
  });
}
