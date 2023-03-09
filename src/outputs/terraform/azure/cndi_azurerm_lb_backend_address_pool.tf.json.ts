import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureLbBackendAddressPoolTFJSON(): string {
  const resource = getTFResource("azurerm_lb_backend_address_pool", {
    loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
    name: "cndi_load_balancer_backend_address_pool",
  });
  return getPrettyJSONString(resource);
}
