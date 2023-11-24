import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureResourceGroupTFJSON(): string {
  const resource = getTFResource("azurerm_resource_group", {
    location: "${local.azure_location}",
    name: "rg-${local.cndi_project_name}",
    tags: { CNDIProject: "${local.cndi_project_name}" },
  });
  return getPrettyJSONString(resource);
}
