import { getPrettyJSONString } from "src/utils.ts";

interface GetGCPComputeEngineProviderTFJSONArg {
  project_id: string;
}

export default function getGCPComputeEngineProviderTFJSON(
  options: GetGCPComputeEngineProviderTFJSONArg,
): string {
  const { project_id } = options;

  return getPrettyJSONString({
    provider: {
      google: {
        project: project_id,
        region: "${local.gcp_region}",
        zone: "${local.gcp_region}-a",
      },
    },
  });
}
