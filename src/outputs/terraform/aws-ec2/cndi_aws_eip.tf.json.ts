import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSElasticIPTFJSON(): string {
  const resource = getTFResource("aws_eip", {
    vpc: true,
    associate_with_private_ip: "10.0.0.5",
    tags: {
      Name: "ElasticIP",
    },
    depends_on: ["aws_internet_gateway.cndi_aws_internet_gateway"],
  });
  return getPrettyJSONString(resource);
}
