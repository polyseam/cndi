import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureLbTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_lb: {
        cndi_azurerm_lb: {
          frontend_ip_configuration: [
            {
              name: "cndi_load_balancer_public_ip",
              public_ip_address_id:
                "${azurerm_public_ip.cndi_azurerm_public_ip.id}",
            },
          ],
          location:
            "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
          name: "cndi_azurerm_lb",
          resource_group_name:
            "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
          sku: "Standard",
          sku_tier: "Regional",
          tags: { CNDIProject: "${local.cndi_project_name}" },
        },
      },
    },
  });
}
