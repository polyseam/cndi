import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

import { DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

interface Azure_LAUNCH_TEMPLATE {
  block_device_mappings: Array<{
    device_name: string;
    ebs: {
      volume_size: number;
    };
  }>;
  metadata_options: {
    http_put_response_hop_limit: number;
    http_tokens: string;
  };
  name_prefix: string;
  tag_specifications: Array<{
    resource_type: string;
    tags: Record<string, string>;
  }>;
}

export default function (cndi_config: CNDIConfig) {
  const azure_launch_template: Record<string, Azure_LAUNCH_TEMPLATE> = {};

  if (Array.isArray(cndi_config.infrastructure.cndi.nodes)) {
    // original non-automatic node group
    let i = 0;
    for (const nodeSpec of cndi_config.infrastructure.cndi.nodes) {
      const volume_size = nodeSpec?.volume_size ||
        nodeSpec?.disk_size ||
        nodeSpec?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE_MANAGED;

      const tags = {
        Name: `cndi-aks-node-group-${nodeSpec.name}`,
        CNDIProject: cndi_config.project_name!,
      };

      azure_launch_template[`cndi_azure_launch_template_${i}`] = {
        block_device_mappings: [
          {
            device_name: "/dev/xvda",
            ebs: {
              volume_size,
            },
          },
        ],
        metadata_options: {
          http_put_response_hop_limit: 2,
          http_tokens: "required",
        },
        name_prefix: `cndi-${nodeSpec.name}-${i}-`,
        tag_specifications: [{ resource_type: "instance", tags }],
      };
      i++;
    }
  } else if (cndi_config.infrastructure.cndi.nodes === "automatic") {
    // automatic node group
  }

  return getPrettyJSONString({
    resource: {
      azure_launch_template,
    },
  });
}
