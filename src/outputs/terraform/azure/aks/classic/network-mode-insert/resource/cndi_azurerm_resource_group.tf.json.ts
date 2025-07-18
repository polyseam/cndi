import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

interface AzurermResourceGroup {
  location: string;
  name: string;
  tags: {
    CNDIProject: string;
  };
}

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_resource_group: Record<string, AzurermResourceGroup> = {
    cndi_azurerm_resource_group: {
      location: "${local.region}",
      name: "rg-cndi-${local.cndi_project_name}",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_resource_group } });
}
