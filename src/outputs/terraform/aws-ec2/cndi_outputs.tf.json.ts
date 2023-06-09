import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      public_host: {
        value: "${aws_lb.cndi_aws_lb.dns_name}",
      },
      resource_group: {
        value:
          "https://${local.aws_region}.console.aws.amazon.com/resource-groups/group/CNDIResourceGroup_${local.cndi_project_name}?region=${local.aws_region}",
      },
    },
  });
}
