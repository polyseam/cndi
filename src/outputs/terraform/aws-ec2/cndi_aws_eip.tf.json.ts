import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";

export default function getAWSComputeInstanceTFJSON(
  node: AWSEC2NodeItemSpec,
): string {
  const { name } = node;

  const resource = getTFResource(
    "aws_eip",
    {
      vpc: true,
      tags: {
        Name: `ElasticIP-${name}`,
      },
      depends_on: ["aws_internet_gateway.cndi_aws_internet_gateway"],
    },
    `cndi_aws_eip_${name}`,
  ).resource;

  return getPrettyJSONString({
    resource,
  });
}
