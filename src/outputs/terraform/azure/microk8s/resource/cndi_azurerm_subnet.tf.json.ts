import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_subnet = {
    cndi_azure_subnet: {
      address_prefixes: ["10.0.1.0/24"],
      name: "cndi-azure-subnet",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      virtual_network_name:
        "${azurerm_virtual_network.cndi_azure_virtual_network.name}",
      service_endpoints: ["Microsoft.Storage"],
    },
  };

  return getPrettyJSONString({ resource: { azurerm_subnet } });
}
