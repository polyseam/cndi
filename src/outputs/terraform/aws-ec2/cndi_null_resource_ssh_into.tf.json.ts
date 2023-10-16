import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";

export default function getNullResource(node: AWSEC2NodeItemSpec): string {
  const { name } = node;
  const resource = getTFResource("null_resource", {
    count: 0,
    triggers: {
      instance_id: `\${aws_instance.cndi_aws_instance_${name}.id}`,
      instance_public_dns:
        `\${aws_instance.cndi_aws_instance_${name}.public_dns}`,
      private_key_pem:
        "${tls_private_key.cndi_tls_private_key.private_key_pem}",
    },
    provisioner: [
      {
        "local-exec": {
          interpreter: ["bash", "-c"],
          when: "destroy",
          command:
            "echo '${self.triggers.private_key_pem}' | sudo tee -a ssh_access_key.pem",
        },
      },
      {
        "local-exec": {
          interpreter: ["bash", "-c"],
          when: "destroy",
          command: "sudo chmod 644 ssh_access_key.pem",
        },
      },
      {
        "local-exec": {
          interpreter: ["bash", "-c"],
          when: "destroy",
          command:
            "ssh -o StrictHostKeyChecking=no -i ssh_access_key.pem ubuntu@${self.triggers.instance_public_dns} 'sudo microk8s remove-node $(hostname) --force'",
        },
      },
    ],
  }, `cndi_null_resource_ssh_into_${name}`);

  return getPrettyJSONString(resource);
}
