import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureLbProbeTFJSON(): string {
  const resource = getTFResource("azurerm_lb_probe", {
    loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
    name: "cndi_load_balancer_http_health_probe",
    port: 80,
    protocol: "Tcp",
  }, "cndi_azurerm_lb_probe_http");
  return getPrettyJSONString(resource);
}
