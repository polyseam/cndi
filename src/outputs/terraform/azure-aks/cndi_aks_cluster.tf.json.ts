import { getPrettyJSONString, getTFModule } from "src/utils.ts";
import { AzureAKSNodeItemSpec } from "src/types.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "consts";

export default function getAzureAKSTFJSON(
  node: AzureAKSNodeItemSpec,
): string {
  const max_size = node?.agents_max_count || 1;
  const min_size = node?.agents_min_count || 0;
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
  const tags = {
    CNDIProject: "${local.cndi_project_name}",
  };
  const agents_tags = {
    CNDIProject: "${local.cndi_project_name}",
  };
  const module = getTFModule(
    "aks_cluster",
    {
      agents_min_count: desired_size,
      agents_max_count: max_size,
      agents_size: machine_type,
      agents_max_pods: 100,
      agents_tags,
      agents_pool_name: "nodepool",
      agents_availability_zones: ["1", "2"],
      agents_count: null,
      cluster_name: "${local.cndi_project_name}",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      node_resource_group:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}-resources",
      os_disk_size_gb,
      os_sku: "Ubuntu",
      os_disk_type: "Managed",
      client_id: "${var.client_id}",
      client_secret: "${var.client_secret}",
      depends_on: ["azurerm_resource_group.cndi_azurerm_resource_group"],
      tags,
      storage_profile_file_driver_enabled: true,
      storage_profile_disk_driver_enabled: true,
      storage_profile_blob_driver_enabled: false,
      sku_tier: "Free",
      prefix: "cndi",
      temporary_name_for_rotation: "temporary",
      enable_auto_scaling: true,
      kubernetes_version: "1.27",
      log_analytics_workspace_enabled: false,
      rbac_aad: false,
      rbac_aad_managed: false,
      network_plugin: "azure",
      source: "Azure/aks/azurerm",
      version: "7.4.0",
      private_cluster_enabled: false,
      public_network_access_enabled: true,
      ultra_ssd_enabled: false,
      vnet_subnet_id: "${azurerm_subnet.cndi_azurerm_subnet.id}",
    },
  );

  return getPrettyJSONString(module);
}
