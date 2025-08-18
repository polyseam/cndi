import { getPrettyJSONString } from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

import { DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

interface AwsLaunchTemplate {
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

export default function (cndi_config: NormalizedCNDIConfig) {
  const aws_launch_template: Record<string, AwsLaunchTemplate> = {};

  if (Array.isArray(cndi_config.infrastructure.cndi.nodes)) {
    // original non-automatic node group
    let i = 0;
    for (const nodeSpec of cndi_config.infrastructure.cndi.nodes) {
      const volume_size = nodeSpec?.volume_size ||
        nodeSpec?.disk_size ||
        nodeSpec?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE_MANAGED;

      const tags = {
        Name: `cndi-eks-node-group-${nodeSpec.name}`,
        CNDIProject: cndi_config.project_name!,
      };

      aws_launch_template[`cndi_aws_launch_template_${i}`] = {
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
  } else if (cndi_config.infrastructure.cndi.nodes === "auto") {
    // automatic node group
  }

  return getPrettyJSONString({
    resource: {
      aws_launch_template,
    },
  });
}
