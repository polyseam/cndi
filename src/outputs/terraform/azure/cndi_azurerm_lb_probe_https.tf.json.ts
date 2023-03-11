import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureLbProbeTFJSON(): string {
  const resource = getTFResource("azurerm_lb_probe", {
    loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
    name: "cndi_load_balancer_https_health_probe",
    port: 443,
  }, "cndi_azurerm_lb_probe_https");
  return getPrettyJSONString(resource);
}
