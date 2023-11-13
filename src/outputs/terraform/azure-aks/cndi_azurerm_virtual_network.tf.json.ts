import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureVirtualNetworkTFJSON(): string {
  const resource = getTFResource("azurerm_virtual_network", {
    address_space: [
      "${cidrsubnet(10.0.0.0/8, 4, random_id.cndi_random_integer_vnet_suffix.dec)}",
    ],
    location: "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
    name: "cndi-virtual-network-${local.cndi_project_name}",
    resource_group_name:
      "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
    tags: { CNDIProject: "${local.cndi_project_name}" },
  });
  return getPrettyJSONString(resource);
}
