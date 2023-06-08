import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  const value = JSON.stringify({
    public_host: "${aws_lb.cndi_aws_lb.dns_name}",
    resource_group:
      "https://${local.aws_region}.console.aws.amazon.com/resource-groups/group/CNDIResourceGroup_${local.cndi_project_name}?region=${local.aws_region}",
  });

  return getPrettyJSONString({
    output: {
      value,
    },
  });
}
