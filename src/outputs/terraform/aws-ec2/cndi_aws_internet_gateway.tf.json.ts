import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSInternetGatewayTFJSON(): string {
  const resource = getTFResource("aws_internet_gateway", {
    tags: {
      Name: "InternetGateway",
    },
    vpc_id: "${aws_vpc.cndi_aws_vpc.id}",
  });
  return getPrettyJSONString(
    resource,
  );
}
