import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSElasticIPTFJSON(): string {
  const resource = getTFResource("aws_eip", {
    vpc: true,
    tags: {
      Name: "ElasticIP",
      CNDIProject: "${local.cndi_project_name}",
    },
    depends_on: ["aws_internet_gateway.cndi_aws_internet_gateway"],
  });
  return getPrettyJSONString(resource);
}
