import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSResourceGroupTFJSON(
  cndi_project_name?: string,
): string {
  const query = JSON.stringify({
    ResourceTypeFilters: [
      "AWS::AllSupported",
    ],
    TagFilters: [
      {
        "Key": "CNDIProject",
        "Values": [`${cndi_project_name}`],
      },
    ],
  });
  const resource = getTFResource("aws_resourcegroups_group", {
    name: "CNDIResourceGroup_${local.cndi_project_name}",
    resource_query: { query },
  });
  return getPrettyJSONString(resource);
}
