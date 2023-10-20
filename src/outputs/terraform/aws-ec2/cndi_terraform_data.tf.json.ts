import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getTerraformData(): string {
  const resource = getTFResource("terraform_data", {
    triggers_replace: "${timestamp()}",
    provisioner: [
      {
        "local-exec": {
          interpreter: ["bash", "-c"],
          command:
            "echo '${tls_private_key.cndi_tls_private_key.private_key_pem}' | sudo tee -a ssh_access_key.pem",
        },
      },
      {
        "local-exec": {
          interpreter: ["bash", "-c"],
          command: "sudo chmod 644 ssh_access_key.pem",
        },
      },
    ],
  }, `cndi_terraform_data`);

  return getPrettyJSONString(resource);
}
