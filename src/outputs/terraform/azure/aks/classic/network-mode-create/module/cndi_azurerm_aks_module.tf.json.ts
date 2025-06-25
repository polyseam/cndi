import { getPrettyJSONString } from "src/utils.ts";
import { getNodeResourceGroupName } from "src/outputs/terraform/azure/utils.ts";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { DEFAULT_K8S_VERSION } from "versions";
import { NETWORK_PROFILE } from "consts";

const MODULE_SOURCE = "Azure/aks/azurerm//v4";

export default function (cndi_config: NormalizedCNDIConfig): string | null {
  const node_resource_group = getNodeResourceGroupName(cndi_config);
  return getPrettyJSONString({
    module: {
      cndi_azurerm_aks_module: {
        version: "10.0.1",
        source: MODULE_SOURCE,
        kubernetes_version: DEFAULT_K8S_VERSION,
        node_resource_group,
        automatic_channel_upgrade: "patch",
        prefix: "cndi-aks-${local.cndi_project_name}",
        location: "${local.cndi_arm_region}",
        identity_type: "SystemAssigned",
        key_vault_secrets_provider_enabled: true,
        secret_rotation_enabled: true,
        load_balancer_sku: "standard",
        network_plugin: "azure",
        network_policy: "azure",
        net_profile_pod_cidr: NETWORK_PROFILE.POD_ADDRESS_SPACE,
        net_profile_service_cidr: NETWORK_PROFILE.SERVICE_ADDRESS_SPACE,
        net_profile_dns_service_ip: NETWORK_PROFILE.DNS_ADDRESS,
        storage_profile_disk_driver_enabled: true,
        storage_profile_file_driver_enabled: true,
        log_analytics_workspace_enabled: false,
        azure_policy_enabled: false,
        depends_on: ["azurerm_resource_group.cndi_azurerm_resource_group"],
        resource_group_name:
          "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
        tags: {
          CNDIProject: "${local.cndi_project_name}",
        },
      },
    },
  });
}
