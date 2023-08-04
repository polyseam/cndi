import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSNATGATEWAYTFJSON(): string {
  const resource = getTFResource("aws_nat_gateway", {
    allocation_id: "${aws_eip.cndi_aws_eip.id}",
    depends_on: [
      "aws_internet_gateway.cndi_aws_internet_gateway",
    ],
    subnet_id: "${aws_subnet.cndi_aws_subnet_public.id}",
    tags: {
      Name: "NATGateway",
    },
  });
  return getPrettyJSONString(resource);
}
