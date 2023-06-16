import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      public_host: {
        value: "${azurerm_public_ip.cndi_azurerm_public_ip_lb.ip_address}",
      },
      resource_group: {
        value:
          "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/#${local.cndi_project_name}",
      },
    },
  });
}
