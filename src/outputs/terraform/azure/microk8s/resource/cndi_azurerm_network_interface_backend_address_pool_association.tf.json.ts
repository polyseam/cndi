import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_network_interface_backend_address_pool_association = {
    cndi_azure_lb_backend_address_pool_association_xnodegroup_0: {
      backend_address_pool_id:
        "${azurerm_lb_backend_address_pool.cndi_azurerm_lb_backend_address_pool.id}",
      ip_configuration_name: "internal",
      network_interface_id:
        "${azurerm_network_interface.cndi_azure_network_interface_xnodegroup_0.id}",
    },
  };

  return getPrettyJSONString({
    resource: { azurerm_network_interface_backend_address_pool_association },
  });
}
