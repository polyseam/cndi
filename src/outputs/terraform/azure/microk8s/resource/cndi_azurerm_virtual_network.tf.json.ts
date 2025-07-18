import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_virtual_network = {
    cndi_azure_virtual_network: {
      address_space: ["10.0.0.0/16"],
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      name: "cndi-azure-vnet",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_virtual_network } });
}
