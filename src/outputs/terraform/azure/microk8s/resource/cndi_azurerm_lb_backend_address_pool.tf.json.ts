import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
  const azurerm_lb_backend_address_pool = {
    cndi_azurerm_lb_backend_address_pool: {
      name: "${local.cndi_project_name}-cndi-lb",
      loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };
  return getPrettyJSONString({ resource: { azurerm_lb_backend_address_pool } });
}
