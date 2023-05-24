import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureLbTFJSON(): string {
  const resource = getTFResource("azurerm_lb", {
    frontend_ip_configuration: [
      {
        name: "cndi_azurerm_lb_frontend_ip_configuration",
        public_ip_address_id: "${azurerm_public_ip.cndi_azurerm_public_ip_lb.id}",
      },
    ],
    location: "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
    name: "cndi_azurerm_lb",
    resource_group_name:
      "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
    sku: "Standard",
    sku_tier: "Regional",
    tags: { CNDIProject: "${local.cndi_project_name}" },
  });
  return getPrettyJSONString(resource);
}
