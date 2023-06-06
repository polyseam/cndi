import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSResourceGroupTFJSON(): string {
  const resource = getTFResource("aws_resourcegroups_group", {
    name: "CNDIResourceGroup_${local.cndi_project_name}",
    resource_query: {
      TagFilters: [
        {
          "Key": "CNDIProject",
          "Values": ["${local.cndi_project_name}"],
        },
      ],
    },
  });
  return getPrettyJSONString(resource);
}
