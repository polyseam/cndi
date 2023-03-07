import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSSubnetTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_lb_rule: {
        HTTP: [
          {
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
          },
        ],
        HTTPS: [
          {
            backend_address_pool_ids: [
               "${azurerm_lb_backend_address_pool.cndi_azurerm_lb_backend_address_pool.id}",
            ],
            backend_port: 443,
            frontend_ip_configuration_name: "cndi_load_balancer_public_ip_address",
            frontend_port: 443,
            loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
            name: "HTTPS",
            probe_id: "${azurerm_lb_probe.cndi_azurerm_lb_probe_https.id}",
            protocol: "Tcp",
          },
        ],
        SSH: [
          {
            backend_address_pool_ids: [
              "${azurerm_lb_backend_address_pool.cndi_azurerm_lb_backend_address_pool.id}",
            ],
            backend_port: 22,
            frontend_ip_configuration_name: "cndi_load_balancer_public_ip_address",
            frontend_port: 22,
            loadbalancer_id: "${azurerm_lb.cndi_azurerm_lb.id}",
            name: "SSH",
            protocol: "Tcp",
          },
        ],
      },
    },
  });
}
