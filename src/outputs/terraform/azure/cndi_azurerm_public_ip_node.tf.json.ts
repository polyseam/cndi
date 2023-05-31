import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AzureNodeItemSpec } from "src/types.ts";

export default function getAzurePublicIpNodeTFJSON(
  node: AzureNodeItemSpec,
): string {
  const { name } = node;
  const resource = getTFResource(
    "azurerm_public_ip",
    {
      allocation_method: "Static",
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      name: `cndi_azurerm_public_ip_${name}`,
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      sku: "Standard",
      zones: ["1"],
      tags: { CNDIProject: "${local.cndi_project_name}" },
    },
    `cndi_azurerm_public_ip_${node.name}`,
  );

  return getPrettyJSONString(resource);
}
