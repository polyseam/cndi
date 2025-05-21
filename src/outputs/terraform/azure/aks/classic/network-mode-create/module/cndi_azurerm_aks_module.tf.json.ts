import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

const MODULE_SOURCE = "Azure/aks/azurerm";

export default function (_cndi_config: CNDIConfig): string | null {
  return getPrettyJSONString({
    module: {
      cndi_azurerm_aks_module: {
        version: "10.0.0",
        source: MODULE_SOURCE,
        location: "${local.cndi_arm_region}",
        resource_group_name:
          "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      },
    },
  });
}
