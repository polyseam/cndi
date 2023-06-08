import { getPrettyJSONString } from "src/utils.ts";

interface GetGCPLocalsTFJSONArg {
  gcp_region: string;
  leader_node_ip: string;
  node_id_list: string[];
  project_id: string;
}

export default function getGCPLocalsTFJSON({
  gcp_region,
  leader_node_ip,
  node_id_list,
  project_id,
}: GetGCPLocalsTFJSONArg): string {
  return getPrettyJSONString({
    locals: {
      gcp_zone: "${local.gcp_region}-a",
      node_id_list,
      gcp_region,
      leader_node_ip,
      project_id,
      bootstrap_token: "${random_password.cndi_join_token.result}",
    },
  });
}
