import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (cndi_config: CNDIConfig) {
  const project_name = "${local.cndi_project_name}";

  return getPrettyJSONString({
    resource: {
      aws_key_pair: {
        cndi_aws_key_pair: {
          public_key: "${var.ssh_public_key}",
          key_name_prefix: `cndi-ssh-key_${project_name}_`,
          tags: {
            Name: `cndi-aws-key-pair_${project_name}`,
          },
        },
      },
    },
  });
}
