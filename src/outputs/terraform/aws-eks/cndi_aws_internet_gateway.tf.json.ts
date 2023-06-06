import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSInternetGatewayTFJSON(): string {
  const resource = getTFResource("aws_internet_gateway", {
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
    tags: {
      Name: "InternetGateway",
      // TODO: delete or uncomment CNDIProject: "${local.cndi_project_name}",
    },
  });
  return getPrettyJSONString(resource);
}
