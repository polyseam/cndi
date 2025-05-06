import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

interface AzurermVirtualNetwork {
  name: string;
  address_space: string[];
  location: string;
  resource_group_name: string;
  tags: {
    CNDIProject: string;
  };
}

export default function (_cndi_config: CNDIConfig) {
  const azurerm_virtual_network: Record<string, AzurermVirtualNetwork> = {
    cndi_azurerm_virtual_network: {
      name: "cndi-azurerm-vnet-${local.cndi_project_name}",
      address_space: [
        "10.0.0.0/16",
      ],
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_virtual_network } });
}
