import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      resource_group: {
        value:
          "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${local.cndi_project_name}",
      },
      public_host: {
        value: "${data.azurerm_public_ips.public.public_ips[0].ip_address}",
      },
      private_host: {
        value: "${data.azurerm_lb.private.private_ip_address}",
      },
    },
  });
}
