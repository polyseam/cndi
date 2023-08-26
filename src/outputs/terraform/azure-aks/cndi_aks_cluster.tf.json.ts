import { getPrettyJSONString, getTFModule } from "src/utils.ts";
import { AzureAKSNodeItemSpec } from "src/types.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "consts";

export default function getAzureAKSTFJSON(
  node: AzureAKSNodeItemSpec,
): string {
  const max_size = node?.agents_max_count || 1;
  const min_size = node?.agents_min_count || 1;
  const desired_size = min_size;

  let machine_type = node?.machine_type || node?.instance_type ||
    DEFAULT_INSTANCE_TYPES.azure;

  let disk_size_gb = node?.disk_size_gb || node?.volume_size ||
    DEFAULT_NODE_DISK_SIZE;

  // azure uses 'size' to describe the machine type, oof
  if (
    node?.size && typeof node.size === "string" && !node?.machine_type &&
    !node?.instance_type
  ) {
    machine_type = node.size;
  }

  if (node?.size && typeof node.size === "number") {
    disk_size_gb = node.size;
  }

  const os_disk_size_gb = disk_size_gb;
  const resource_group_name =
    "${azurerm_resource_group.cndi_azurerm_resource_group.name}";

  const tags = {
    CNDIProject: "${local.cndi_project_name}",
  };
  const client_id = Deno.env.get("TF_VAR_ARM_CLIENT_ID") as string;
  const client_secret = Deno.env.get("TF_VAR_ARM_CLIENT_SECRET") as string;

  const module = getTFModule(
    "cndi_aks_cluster",
    {
      agents_min_count: desired_size,
      agents_max_count: max_size,
      agents_size: machine_type,
      cluster_name: node?.name,
      resource_group_name: resource_group_name,
      os_disk_size_gb,
      client_id: client_id,
      client_secret: client_secret,
      depends_on: [resource_group_name],
      tags,
      storage_profile_file_driver_enabled: true,
      storage_profile_disk_driver_enabled: true,
      storage_profile_blob_driver_enabled: true,
      sku_tier: "Free",
      prefix: "cndi",
      enable_auto_scaling: true,
      enable_node_public_ip: true,
      kubernetes_version: "1.26",
      agents_pool_name: "workers",
      log_analytics_workspace_enabled: false,
      rbac_aad: false,
      network_plugin: "azure",
      agents_count: null,
      agents_max_pods: 100,
      source: "Azure/aks/azurerm",
      version: "7.3.1",
    },
  );

  return getPrettyJSONString(module);
}
