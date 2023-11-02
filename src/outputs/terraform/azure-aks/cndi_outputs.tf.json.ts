import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      resource_group: {
        value:
          "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${local.cndi_project_name}",
      },
    },
  });
}
