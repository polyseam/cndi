import { getPrettyJSONString } from "src/utils.ts";

export default function getAzurermSubnetTFJSON(): string {
  return getPrettyJSONString({
    locals: [
      {
        location: "",
        cndi_project_name: "",
        leader_node_ip: "",
        bootstrap_token: "${random_password.generated_token.result}",
      },
    ],
  });
}
