import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureVirtualNetworkTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_virtual_network: {
        cndi_azurerm_virtual_network: {
          address_space: ["10.0.0.0/16"],
          location:
            "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
          name: "cndi_virtual_network",
          resource_group_name:
            "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
          tags: { CNDIProject: "${local.cndi_project_name}" },
        },
      },
    },
  });
}
