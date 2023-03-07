import { getPrettyJSONString } from "src/utils.ts";

interface GetGCPComputeEngineProviderTFJSONArg {
  project_id: string;
  region: string;
  zone: string;
}

export default function getGCPComputeEngineProviderTFJSON(
  options: GetGCPComputeEngineProviderTFJSONArg,
): string {
  const { project_id, region, zone } = options;

  return getPrettyJSONString({
    provider: {
      google: {
        project: project_id,
        region,
        zone,
      },
    },
  });
}
