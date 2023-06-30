import { getPrettyJSONString } from "src/utils.ts";
import { MultipassNodeItemSpec } from "src/types.ts";

export default function getOutputTFJSON(node: MultipassNodeItemSpec): string {
  return getPrettyJSONString({
    output: {
      argocd_server_ui_instructions: {
        value:
          "Run the following command in your terminal to access the Argocd server",
      },
      I: {
        value:
          `multipass exec ${node.name} -- ip route get 1.2.3.4 | awk '{print $7}'`,
      },
      II: {
        value:
          `multipass exec ${node.name} -- sudo microk8s kubectl port-forward svc/argocd-server -n argocd 8080:443 --address <ip address of node>`,
      },
      III: {
        value: "Then run https://<ip address of node>:8080 in your browser",
      },
    },
  });
}
