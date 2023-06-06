import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSComputeEngineProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: {
      aws: {
        region: "${local.aws_region}",
        default_tags: {
          tags: {
            CNDIProject: "${local.cndi_project_name}",
            CNDIVersion: "v1",
          },
        },
      },
    },
  });
}
