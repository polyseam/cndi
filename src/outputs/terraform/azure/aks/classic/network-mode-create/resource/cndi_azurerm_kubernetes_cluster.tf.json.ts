import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { DEFAULT_K8S_VERSION } from "versions";

import {
  type AzurermKubernetesClusterDefaultNodePool,
  getNodePools,
} from "./cndi_azurerm_kubernetes_cluster_node_pool.tf.json.ts";

interface AzurermKubernetesCluster {
  location: string;
  name: string;
  tags: Record<string, string>;
  automatic_upgrade_channel: string;
  dns_prefix: string;
  identity: {
    type: "SystemAssigned";
  };
  key_vault_secrets_provider: {
    secret_rotation_enabled: boolean;
  };
  kubernetes_version: string;
  network_profile: {
    dns_service_ip: string;
    load_balancer_sku: string;
    network_plugin: string;
    network_policy: string;
    service_cidr: string;
  };
  node_resource_group: string;
  resource_group_name: string;
  role_based_access_control_enabled: boolean;
  sku_tier: string;
  storage_profile: {
    blob_driver_enabled: boolean;
    disk_driver_enabled: boolean;
    file_driver_enabled: boolean;
  };
  default_node_pool: AzurermKubernetesClusterDefaultNodePool;
}

export default function (cndi_config: CNDIConfig) {
  const [default_node_pool] = getNodePools(cndi_config);
  const azurerm_kubernetes_cluster: Record<string, AzurermKubernetesCluster> = {
    cndi_azurerm_kubernetes_cluster: {
      default_node_pool,
      automatic_upgrade_channel: "patch",
      dns_prefix: "cndi-${local.cndi_project_name}",
      identity: {
        type: "SystemAssigned",
      },
      key_vault_secrets_provider: {
        secret_rotation_enabled: true,
      },
      kubernetes_version: DEFAULT_K8S_VERSION,
      location: "${local.cndi_arm_region}",
      name: "cndi-aks-${local.cndi_project_name}",
      network_profile: {
        load_balancer_sku: "standard",
        network_plugin: "azure",
        network_policy: "azure",
        service_cidr: "192.168.0.0/16",
        dns_service_ip: "192.168.10.0",
      },
      node_resource_group: "nrg-cndi-${local.cndi_project_name}",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      role_based_access_control_enabled: false,
      sku_tier: "Free",
      storage_profile: {
        blob_driver_enabled: false,
        disk_driver_enabled: true,
        file_driver_enabled: true,
      },
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_kubernetes_cluster } });
}
