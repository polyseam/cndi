import { getPrettyJSONString } from "src/utils.ts";
import { MultipassNodeItemSpec } from "src/types.ts";

export default function getOutputTFJSON(node: MultipassNodeItemSpec): string {
  return getPrettyJSONString({
    output: {
      argocd_server_ui_instructions: {
        value:
          "Run the following command in your terminal to access the Argocd server",
      },
      multi_pass_command: {
        value:
          `multipass exec ${node.name} -- sudo microk8s kubectl port-forward svc/argocd-server -n argocd 8080:443 --address \${data.local_file.cndi_data_local_file.content}`,
      },
      browser_command: {
        value:
          "Then run https://${data.local_file.cndi_data_local_file.content}:8080 in your browser",
      },
    },
  });
}
