import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AzureNodeItemSpec } from "../../../types.ts";

export default function getAzureNetworkInterfaceBackendAddressPoolAssociationTFJSON(
  node: AzureNodeItemSpec,
): string {
  const { name } = node;
  const resource = getTFResource(
    "azurerm_network_interface_backend_address_pool_association",
    {
      backend_address_pool_id:
        "${azurerm_lb_backend_address_pool.cndi_azurerm_lb_backend_address_pool.id}",
      ip_configuration_name: `cndi_azurerm_network_interface_ip_config_${name}`,
      network_interface_id:
        `\${azurerm_network_interface.cndi_azurerm_network_interface_network_interface_${name}.id}`,
    },
    `cndi_azurerm_network_interface_backend_address_pool_association_${node.name}`,
  );

  return getPrettyJSONString(resource);
}
