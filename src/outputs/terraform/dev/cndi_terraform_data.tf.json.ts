import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { MultipassNodeItemSpec } from "src/types.ts";

export default function getMultipassTerraformDataTFJSON(
  node: MultipassNodeItemSpec,
): string {
  const resource = getTFResource("terraform_data", {
    depends_on: ["multipass_instance.cndi_multipass_instance"],
    provisioner: {
      "local-exec": {
        "command":
          `multipass exec ${node.name} -- ip route get 1.2.3.4 | awk '{print $7}' | tr -d '\n' > cndi/terraform/leader_ip_address.txt`,
      },
    },
  });

  return getPrettyJSONString(
    resource,
  );
}
