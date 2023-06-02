import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

export default function getAzureLbRuleCustomPortTFJSON(port: CNDIPort): string {
  const resource = getTFResource("azurerm_lb_rule", {
    backend_address_pool_ids: [
      "${azurerm_lb_backend_address_pool.cndi_azurerm_lb_backend_address_pool.id}",
    ],
    backend_port: port.number,
    frontend_ip_configuration_name: "cndi_azurerm_lb_frontend_ip_configuration",
    frontend_port: port.number,
    loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
    name: "HTTP",
    probe_id: `\${azurerm_lb_probe.cndi_azurerm_lb_probe_${port.name}.id}`,
    protocol: "Tcp",
  }, `cndi_azurerm_lb_rule_${port.name}`);
  return getPrettyJSONString(resource);
}
