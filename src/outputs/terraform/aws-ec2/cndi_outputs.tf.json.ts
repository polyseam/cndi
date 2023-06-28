import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      public_host: {
        // GitHub Actions Secrets will redact the domain is it contains the secret AWS_REGION
        // so we need to replace the secret with the same value in uppercase
        value:
          "${replace(aws_lb.cndi_aws_lb.dns_name,local.aws_region,upper(local.aws_region))}",
      },
      resource_group: {
        value:
          "https://${upper(local.aws_region)}.console.aws.amazon.com/resource-groups/group/CNDIResourceGroup_${local.cndi_project_name}?region=${upper(local.aws_region)}",
      },
    },
  });
}
