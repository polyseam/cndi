import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface Azure_RESOURCEGROUPS_GROUP {
  name: string;
  resource_query: {
    query: string;
  };
  tags: Record<string, string>;
}

export default function (_cndi_config: CNDIConfig) {
  const azure_resourcegroups_group: Record<string, Azure_RESOURCEGROUPS_GROUP> =
    {
      cndi_azure_resourcegroups_group: {
        name: "cndi-rg_${local.cndi_project_name}",
        resource_query: {
          query: JSON.stringify({
            ResourceTypeFilters: ["Azure::AllSupported"],
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
      azure_resourcegroups_group,
    },
  });
}
