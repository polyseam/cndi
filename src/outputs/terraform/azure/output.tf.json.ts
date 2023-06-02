import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureLBIPTFJSON(): string {
    return getPrettyJSONString({
        output: {
            azure_load_balancer_ip_address: {
                value: "${azurerm_public_ip_lb.cndi_azurerm_public_ip_lb.ip_address}",
            },
        },
    });
}
