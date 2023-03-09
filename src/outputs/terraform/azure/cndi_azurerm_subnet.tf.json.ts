import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureSubnetTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_subnet: {
        cndi_azurerm_subnet: {
          address_prefixes: ["10.0.0.0/24"],
          name: "cndi_subnet",
          resource_group_name:
            "${azurerm_resource_group.azurerm_cndi_resource_group.name}",
          virtual_network_name:
            "${azurerm_virtual_network.cndi_azurerm_virtual_network.name}",
        },
      },
    },
  });
}
