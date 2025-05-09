import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

interface AzurermSubnet {
  name: string;
  address_prefixes: string[];
  resource_group_name: string;
  virtual_network_name: string;
}

export default function (_cndi_config: CNDIConfig) {
  const azurerm_subnet: Record<string, AzurermSubnet> = {
    cndi_azurerm_subnet: {
      name: "cndi-az-subnet-${local.cndi_project_name}",
      address_prefixes: [
        "10.0.0.0/20",
      ],
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      virtual_network_name:
        "${azurerm_virtual_network.cndi_azurerm_virtual_network.name}",
    },
  };

  return getPrettyJSONString({ resource: { azurerm_subnet } });
}
