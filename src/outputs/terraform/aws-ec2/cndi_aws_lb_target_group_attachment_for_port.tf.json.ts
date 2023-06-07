import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec, CNDIPort } from "src/types.ts";

export default function getAWSComputeInstanceTargetGroupAttachmentTFJSON(
  node: AWSEC2NodeItemSpec,
  port: CNDIPort,
): string {
  const { name } = node;
  const target_id = `\${aws_instance.cndi_aws_instance_${name}.id}`;

  const resource = getTFResource("aws_lb_target_group_attachment", {
    target_group_arn:
      `\${aws_lb_target_group.cndi_aws_lb_target_group_${port.name}.arn}`,
    target_id,
  }, `cndi_aws_lb_target_group_attachment_${port.name}_${name}`);

  return getPrettyJSONString(
    resource,
  );
}
