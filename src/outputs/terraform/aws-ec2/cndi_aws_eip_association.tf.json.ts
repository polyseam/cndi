import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";

export default function getAWSComputeInstanceElasticAssociationIPTFJSON(
  node: AWSEC2NodeItemSpec,
): string {
  const { name } = node;

  const resource = getTFResource("aws_eip_association", {
    instance_id: `\${aws_instance.cndi_aws_instance_${name}.id}`,
    allocation_id: `\${aws_eip.cndi_aws_eip_${name}.id}`,
  }, `cndi_aws_eip_association_${name}`);

  return getPrettyJSONString(
    resource,
  );
}
