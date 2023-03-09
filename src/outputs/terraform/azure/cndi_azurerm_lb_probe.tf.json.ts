import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureLbProbeTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_lb_probe: {
        cndi_azurerm_lb_probe_http: {
          loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
          name: "cndi_load_balancer_http_health_probe",
          port: 80,
          protocol: "Tcp",
        },
        cndi_azurerm_lb_probe_https: {
          loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
          name: "cndi_load_balancer_https_health_probe",
          port: 443,
        },
      },
    },
  });
}
