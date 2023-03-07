import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureResourceGroupTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      azurerm_resource_group: {
        cndi_azurerm_resource_group: {
          location: "${local.location}",
          name: "${local.cndi_project_name}",
          tags: { CNDIProject: "${local.cndi_project_name}" },
        },
      },
    },
  });
}
