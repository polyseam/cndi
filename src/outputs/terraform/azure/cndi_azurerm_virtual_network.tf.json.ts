import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureVirtualNetworkTFJSON(): string {
  const resource = getTFResource("azurerm_virtual_network", {
    address_space: ["10.0.0.0/16"],
    location: "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
    name: "cndi_virtual_network",
    resource_group_name:
      "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
    tags: { CNDIProject: "${local.cndi_project_name}" },
  });
  return getPrettyJSONString(resource);
}
