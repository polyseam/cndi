import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      resource_group: {
        value:
          "https://${upper(local.aws_region)}.console.aws.amazon.com/resource-groups/group/CNDIResourceGroup_${local.cndi_project_name}?region=${upper(local.aws_region)}",
      },
      public_host: {
        value:
          "${replace(data.aws_lb.cndi_aws_lb.dns_name,local.aws_region,upper(local.aws_region))}",
      },
    },
  });
}
