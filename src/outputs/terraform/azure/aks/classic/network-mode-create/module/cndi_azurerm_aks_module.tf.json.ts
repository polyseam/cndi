import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";
import { DEFAULT_K8S_VERSION } from "versions";

const MODULE_SOURCE = "Azure/aks/azurerm//v4";

export default function (_cndi_config: CNDIConfig): string | null {
  return getPrettyJSONString({
    module: {
      cndi_azurerm_aks_module: {
        version: "10.0.1",
        source: MODULE_SOURCE,
        kubernetes_version: DEFAULT_K8S_VERSION,
        automatic_channel_upgrade: "patch",
        prefix: "cndi-aks-${local.cndi_project_name}",
        location: "${local.cndi_arm_region}",
        identity_type: "SystemAssigned",
        key_vault_secrets_provider_enabled: true,
        secret_rotation_enabled: true,
        load_balancer_sku: "standard",
        network_plugin: "azure",
        network_policy: "azure",
        net_profile_service_cidr: "192.168.0.0/16",
        net_profile_dns_service_ip: "192.168.10.0",
        storage_profile_disk_driver_enabled: true,
        storage_profile_file_driver_enabled: true,
        node_resource_group: "nrg-cndi-${local.cndi_project_name}",
        log_analytics_workspace_enabled: false, // true caused permission error
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
