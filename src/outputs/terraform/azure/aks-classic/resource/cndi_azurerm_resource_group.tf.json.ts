import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

interface AZURERM_RESOURCE_GROUP {
  location: string;
  name: string;
  tags: {
    CNDIProject: string;
  };
}

export default function (_cndi_config: CNDIConfig) {
  const azurerm_resource_group: Record<string, AZURERM_RESOURCE_GROUP> = {
    cndi_azurerm_resource_group: {
      location: "${local.cndi_arm_region}",
      name: "rg-cndi-${local.cndi_project_name}",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_resource_group } });
}
