import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

interface AzurermKubernetesCluster {
  location: string;
  name: string;
  tags: {
    CNDIProject: string;
  };
}

export default function (_cndi_config: CNDIConfig) {
  const azurerm_kubernetes_cluster: Record<string, AzurermKubernetesCluster> = {
    cndi_azurerm_kubernetes_cluster: {
      "automatic_upgrade_channel": "patch",
      "default_node_pool": {
        "auto_scaling_enabled": true,
        "max_count": 3,
        "max_pods": 110,
        "min_count": 3,
        "name": "xnodegroup",
        "node_count": 3,
        "node_labels": {},
        "os_disk_size_gb": 100,
        "os_disk_type": "Managed",
        "os_sku": "Ubuntu",
        "tags": {
          "CNDIProject": "${local.cndi_project_name}",
        },
        "temporary_name_for_rotation": "temp0",
        "type": "VirtualMachineScaleSets",
        "vm_size": "Standard_D2s_v3",
        "vnet_subnet_id": "${azurerm_subnet.cndi_azure_subnet.id}",
        "zones": [
          "1",
        ],
      },
      "dns_prefix": "cndi-${local.cndi_project_name}",
      "identity": {
        "type": "SystemAssigned",
      },
      "key_vault_secrets_provider": {
        "secret_rotation_enabled": true,
      },
      "kubernetes_version": "1.31",
      "location": "${local.cndi_arm_region}",
      "name": "cndi-aks-${local.cndi_project_name}",
      "network_profile": {
        "dns_service_ip": "192.168.10.0",
        "load_balancer_sku": "standard",
        "network_plugin": "azure",
        "network_policy": "azure",
        "service_cidr": "192.168.0.0/16",
      },
      "node_resource_group": "nrg-cndi-${local.cndi_project_name}",
      "resource_group_name":
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      "role_based_access_control_enabled": false,
      "sku_tier": "Free",
      "storage_profile": {
        "blob_driver_enabled": false,
        "disk_driver_enabled": true,
        "file_driver_enabled": true,
      },
      "tags": {
        "CNDIProject": "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_resource_group } });
}
