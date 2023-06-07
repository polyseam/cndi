import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPComputeEngineProviderTFJSON(
): string {

  return getPrettyJSONString({
    provider: {
      google: {
        project: "${local.project_id}",
        region: "${local.gcp_region}",
        zone: "${local.gcp_region}-a",
      },
    },
  });
}
