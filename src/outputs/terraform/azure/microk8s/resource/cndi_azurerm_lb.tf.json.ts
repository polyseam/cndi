import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_lb = {
    cndi_azurerm_lb: {
      name: "${local.cndi_project_name}-cndi-lb",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      frontend_ip_configuration: [{
        name: "cndi-azurerm-lb-frontend-config",
        public_ip_address_id: "${azurerm_public_ip.cndi_azure_public_ip.id}",
      }],
      sku: "Standard",
      sku_tier: "Regional",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };
  return getPrettyJSONString({ resource: { azurerm_lb } });
}
