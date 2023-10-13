import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AWSEC2NodeItemSpec } from "src/types.ts";

export default function getNullResource(node: AWSEC2NodeItemSpec): string {
  const { name } = node;
  const resource = getTFResource("null_resource", {
    triggers: {
      instance_id: `aws_instance.cndi_aws_instance_${name}.id`,
      instance_public_dns: `aws_instance.cndi_aws_instance_${name}.public_dns`,
      private_key_pem: "tls_private_key.cndi_tls_private_key.private_key_pem",
    },
    provisioner: [
      {
        "local-exec": {
          interpreter: ["bash", "-c"],

          command:
            "echo '${self.triggers.private_key_pem}' > cndi_key_pair.pem chmod 400 cndi_key_pair.pem",
        },
      },
      {
        "local-exec": {
          interpreter: ["bash", "-c"],

          command:
            "ssh -o StrictHostKeyChecking=no -i cndi_key_pair.pem ubuntu@${self.triggers.instance_public_dns} touch text.txt",
        },
      },
    ],
  }, `cndi_null_resource_ssh_into_${name}`);

  return getPrettyJSONString(resource);
}
