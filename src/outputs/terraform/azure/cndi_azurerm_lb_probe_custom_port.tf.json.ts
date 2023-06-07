import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

export default function getAzureLbProbeTFJSON(port: CNDIPort): string {
  const resource = getTFResource("azurerm_lb_probe", {
    loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
    name: `cndi_load_balancer_${port.name}_health_probe`,
    port: port.number,
  }, `cndi_azurerm_lb_probe_${port.name}`);
  return getPrettyJSONString(resource);
}
