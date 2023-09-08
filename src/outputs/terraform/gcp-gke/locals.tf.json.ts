import { getPrettyJSONString } from "src/utils.ts";

interface GetGKELocalsTFJSONArg {
  gcp_region: string;
  project_id: string;
  client_email: string;
}

export default function getGCPLocalsTFJSON({
  gcp_region,
  project_id,
  client_email,
}: GetGKELocalsTFJSONArg): string {
  return getPrettyJSONString({
    locals: {
      gcp_zones: ["${local.gcp_region}-a", "${local.gcp_region}-b"],
      gcp_region,
      project_id,
      client_email,
    },
  });
}
