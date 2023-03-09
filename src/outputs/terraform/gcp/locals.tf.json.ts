import { getPrettyJSONString } from "src/utils.ts";

interface GetGCPLocalsTFJSONArg {
  gcp_region: string;
  leader_node_ip: string;
}

export default function getGCPLocalsTFJSON({
  gcp_region,
  leader_node_ip
}: GetGCPLocalsTFJSONArg): string {
  return getPrettyJSONString({
    locals: [
      {
        gcp_zone: "${local.gcp_region}-a",
        gcp_region,
        leader_node_ip,
        bootstrap_token: "${random_password.generated_token.result}",
      },
    ],
  });
}
