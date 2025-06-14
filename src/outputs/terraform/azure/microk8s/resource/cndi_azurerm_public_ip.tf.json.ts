import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_public_ip = {
    cndi_azure_public_ip: {
      allocation_method: "Static",
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      name: "cndi-azure-public-ip",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      sku: "Standard",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_public_ip } });
}
