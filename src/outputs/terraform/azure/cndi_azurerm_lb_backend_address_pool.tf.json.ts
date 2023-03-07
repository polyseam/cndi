import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureLbBackendAddressPoolTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_lb_backend_address_pool: {
        cndi_azurerm_lb_backend_address_pool: {
          loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
          name: "cndi_load_balancer_backend_address_pool",
        },
      },
    },
  });
}
