import { getPrettyJSONString } from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

interface AwsResourcegroupsGroup {
  name: string;
  resource_query: {
    query: string;
  };
  tags: Record<string, string>;
}

export default function (_cndi_config: NormalizedCNDIConfig) {
  const aws_resourcegroups_group: Record<string, AwsResourcegroupsGroup> = {
    cndi_aws_resourcegroups_group: {
      name: "cndi-rg_${local.cndi_project_name}",
      resource_query: {
        query: JSON.stringify({
          ResourceTypeFilters: ["AWS::AllSupported"],
          TagFilters: [{
            Key: "CNDIProject",
            Values: ["${local.cndi_project_name}"],
          }],
        }),
      },
      tags: {
        Name: "cndi-rg_${local.cndi_project_name}",
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({
    resource: {
      aws_resourcegroups_group,
    },
  });
}
