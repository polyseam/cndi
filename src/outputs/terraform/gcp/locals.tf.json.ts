import { getPrettyJSONString } from "src/utils.ts";

export default function getAzurermLocalsTFJSON(): string {
  return getPrettyJSONString({
    locals: [
      {
        zone: "${local.region}-a",
        region: "",
        leader_node_ip: "",
        bootstrap_token: "${random_password.generated_token.result}",
      },
    ],
  });
}
