import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";

export default function getTerraformData(node: AWSEC2NodeItemSpec): string {
  const { name } = node;
  const resource = getTFResource("terraform_data", {
    triggers_replace: [`\${aws_instance.cndi_aws_instance_${name}.id}`],
    input: {
      instance_public_dns:
        `\${aws_instance.cndi_aws_instance_${name}.public_dns}`,
    },

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
      {
        "local-exec": {
          interpreter: ["bash", "-c"],
          command:
            "ssh -o StrictHostKeyChecking=no -i ssh_access_key.pem ubuntu@${self.input.instance_public_dns} 'sudo microk8s remove-node $(hostname) --force'",
        },
      },
    ],
  }, `cndi_terraform_data_${name}`);

  return getPrettyJSONString(resource);
}
