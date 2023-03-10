import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureLbRuleHTTPTFJSON(): string {
  const resource = getTFResource("azurerm_lb_rule", {
    backend_address_pool_ids: [
      "${azurerm_lb_backend_address_pool.cndi_azurerm_lb_backend_address_pool.id}",
    ],
    backend_port: 80,
    frontend_ip_configuration_name: "cndi_load_balancer_public_ip_address",
    frontend_port: 80,
    loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
    name: "HTTP",
    probe_id: "${azurerm_lb_probe.cndi_azurerm_lb_probe_http.id}",
    protocol: "Tcp",
  }, "cndi_azurerm_lb_rule_http");
  return getPrettyJSONString(resource);
}
