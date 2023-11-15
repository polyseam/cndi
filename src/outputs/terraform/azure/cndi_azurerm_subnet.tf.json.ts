import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureSubnetTFJSON(): string {
  const resource = getTFResource("azurerm_subnet", {
    address_prefixes: [
      "10.0.0.0/24",
    ],
    name: "cndi-subnet-${local.cndi_project_name}",
    private_endpoint_network_policies_enabled: true,
    private_link_service_network_policies_enabled: true,
    resource_group_name:
      "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
    virtual_network_name:
      "${azurerm_virtual_network.cndi_azurerm_virtual_network.name}",
  });
  return getPrettyJSONString(resource);
}
