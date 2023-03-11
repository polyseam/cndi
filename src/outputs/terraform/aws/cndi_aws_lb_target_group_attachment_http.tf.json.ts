import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSNodeItemSpec } from "../../../types.ts";

export default function getAWSComputeInstanceTargetGroupAttachmentTFJSON(
  node: AWSNodeItemSpec,
): string {
  const { name } = node;
  const target_id = `\${aws_instance.cndi_aws_instance_${name}.id}`;

  const resource = getTFResource("aws_lb_target_group_attachment", {
    target_group_arn:
      "${aws_lb_target_group.cndi_aws_lb_target_group_http.arn}",
    target_id,
  }, `cndi_aws_lb_target_group_attachment_http_${name}`);

  return getPrettyJSONString(
    resource,
  );
}
