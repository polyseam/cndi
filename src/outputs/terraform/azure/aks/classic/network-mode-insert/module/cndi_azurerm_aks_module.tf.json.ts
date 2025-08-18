import { getPrettyJSONString } from "src/utils.ts";
import { getNodeResourceGroupName } from "src/outputs/terraform/azure/utils.ts";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { DEFAULT_K8S_VERSION } from "versions";

const MODULE_SOURCE = "Azure/aks/azurerm//v4";

export default function (cndi_config: NormalizedCNDIConfig): string | null {
  const node_resource_group = getNodeResourceGroupName(cndi_config);

  // For network-mode-insert, we use the provided subnets
  // The first subnet is used for the control plane
  const controlPlaneSubnetId = "${local.private_subnet_ids[0]}";

  // Additional subnets for node pools (if any)
  // This will be a Terraform expression that slices the subnets array
  const additionalNodePoolSubnetIds =
    "${length(local.private_subnet_ids) > 1 ? jsonencode([for i in range(1, length(local.private_subnet_ids)) : local.private_subnet_ids[i]]) : '[]'}";

  const kubernetes_version = cndi_config?.kubernetes_version ||
    DEFAULT_K8S_VERSION;
  return getPrettyJSONString({
    module: {
      cndi_azurerm_aks_module: {
        version: "10.0.1",
        source: MODULE_SOURCE,
        kubernetes_version,
        node_resource_group,
        automatic_channel_upgrade: "patch",
        prefix: "cndi-aks-${local.cndi_project_name}",
        location: "${local.region}",
        identity_type: "SystemAssigned",
        key_vault_secrets_provider_enabled: true,
        secret_rotation_enabled: true,
        load_balancer_sku: "standard",
        network_plugin: "azure",
        network_policy: "azure",
        storage_profile_disk_driver_enabled: true,
        storage_profile_file_driver_enabled: true,
        log_analytics_workspace_enabled: false,
        azure_policy_enabled: false,
        depends_on: ["azurerm_resource_group.cndi_azurerm_resource_group"],
        resource_group_name:
          "${azurerm_resource_group.cndi_azurerm_resource_group.name}",

        // Use existing VNet and subnets
        vnet_subnet_id: controlPlaneSubnetId,
        node_pool_subnet_ids: additionalNodePoolSubnetIds,

        tags: {
          CNDIProject: "${local.cndi_project_name}",
        },
      },
    },
  });
}
