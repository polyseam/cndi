import { getPrettyJSONString } from "src/utils.ts";

interface GetAzureLocalsTFJSONArg {
  azure_location: string;
  leader_node_ip: string;
  node_id_list: string[];
}

export default function getAzureLocalsTFJSON({
  azure_location,
  leader_node_ip,
  node_id_list,
}: GetAzureLocalsTFJSONArg): string {
  return getPrettyJSONString({
    locals: {
      azure_location,
      leader_node_ip,
      node_id_list,
      bootstrap_token: "${random_password.cndi_join_token.result}",
    },
  });
}
