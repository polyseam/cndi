import { getPrettyJSONString } from "src/utils.ts";
import { AWSNodeItemSpec } from "../../../types.ts";

export default function getAWSComputeInstanceTargetGroupAttachmentTFJSON(
  node: AWSNodeItemSpec,
): string {
  const { name } = node;
  const target_id = `\${aws_instance.cndi_aws_instance_${name}.id}`;
  const resource = {
    [`aws_lb_target_group_attachment_${name}`]: {
      [`cndi_aws_lb_target_group_attachment_https_${name}`]: [
        {
          target_group_arn:
            "${aws_lb_target_group.cndi_aws_lb_target_group_https.arn}",
          target_id,
        },
      ],
      [`cndi_aws_lb_target_group_attachment_http_${name}`]: [
        {
          target_group_arn:
            "${aws_lb_target_group.cndi_aws_lb_target_group_http.arn}",
          target_id,
        },
      ],
    },
  };
  return getPrettyJSONString({
    resource,
  });
}
