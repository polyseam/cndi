import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AWS_RESOURCEGROUPS_GROUP {
  name: string;
  resource_query: {
    query: string;
  };
  tags: Record<string, string>;
}

export default function (_cndi_config: CNDIConfig) {
  const aws_resourcegroups_group: Record<string, AWS_RESOURCEGROUPS_GROUP> = {
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
