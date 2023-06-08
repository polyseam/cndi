import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  const value = {
    public_host: "${azurerm_public_ip_lb.cndi_azurerm_public_ip_lb.ip_address}", // TODO: Add public host
    resource_group:
      "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/#${local.cndi_project_name}",
  };

  return getPrettyJSONString({
    output: {
      value,
    },
  });
}
