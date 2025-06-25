import { CNDINodeSpec, NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import {
  getPrettyJSONString,
  getTaintEffectForDistribution,
} from "src/utils.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

export interface AzurermKubernetesClusterNodePool {
  name: string;
  auto_scaling_enabled: boolean;
  max_count: number;
  max_pods: number;
  min_count: number;
  node_count: number;
  node_labels: Record<string, string>;
  os_disk_size_gb: number;
  os_disk_type: string;
  os_sku: string;
  tags: Record<string, string>;
  temporary_name_for_rotation?: string;
  vm_size: string;
  node_taints: string[];
  kubernetes_cluster_id: string;
  // zones: string[];
  zones: string; // local
}

export function getNodePools(
  cndi_config: NormalizedCNDIConfig,
): AzurermKubernetesClusterNodePool[] {
  const azurerm_kubernetes_cluster_node_pool = cndi_config.infrastructure.cndi
    .nodes.map(
      (nodeSpec: CNDINodeSpec, i: number) => {
        const node_count = nodeSpec?.count ?? 1;

        const max_count = nodeSpec?.max_count || node_count;
        const min_count = nodeSpec?.min_count || node_count;
        const name = nodeSpec?.name || "default-node-pool";

        const node_labels = nodeSpec?.labels || {};
        const os_disk_size_gb = nodeSpec?.size as number ||
          nodeSpec?.disk_size ||
          nodeSpec?.disk_size_gb || DEFAULT_NODE_DISK_SIZE_MANAGED;

        const os_disk_type = nodeSpec?.disk_type || "Managed";

        const vm_size = nodeSpec?.vm_size || nodeSpec?.instance_type ||
          DEFAULT_INSTANCE_TYPES["azure"];

        const node_taints =
          nodeSpec.taints?.map((taint) =>
            `${taint.key}=${taint.value}:${
              getTaintEffectForDistribution(taint.effect, "aks")
            }` // taint.effect must be valid by now
          ) || [];

        const temporary_name_for_rotation = `tmpnodep${i}`;

        return {
          name,
          os_disk_size_gb,
          os_disk_type,
          auto_scaling_enabled: true,
          max_count,
          min_count,
          node_count,
          vm_size,
          node_labels,
          max_pods: 110,
          os_sku: "Ubuntu",
          tags: {
            CNDIProject: "${local.cndi_project_name}",
          },
          zones: "${local.availability_zones}",
          kubernetes_cluster_id: "${module.cndi_azurerm_aks_module.aks_id}",
          node_taints,
          temporary_name_for_rotation,
        } as AzurermKubernetesClusterNodePool;
      },
    );

  return azurerm_kubernetes_cluster_node_pool as AzurermKubernetesClusterNodePool[];
}

export default function (cndi_config: NormalizedCNDIConfig) {
  const cndi_azurerm_kubernetes_cluster_node_pool = getNodePools(
    cndi_config,
  );

  // only create non-default node pools if cndi_config.infrastructure.cndi.nodes.length > 1
  if (
    Array.isArray(cndi_azurerm_kubernetes_cluster_node_pool) &&
    cndi_azurerm_kubernetes_cluster_node_pool.length
  ) {
    const azurerm_kubernetes_cluster_node_pool: Record<
      string,
      AzurermKubernetesClusterNodePool
    > = {};

    let i = 0;

    for (const nodePool of cndi_azurerm_kubernetes_cluster_node_pool) {
      const key = `cndi_azurerm_kubernetes_cluster_node_pool_${i}`;
      azurerm_kubernetes_cluster_node_pool[key] = nodePool;
      i++;
    }

    return getPrettyJSONString({
      resource: { azurerm_kubernetes_cluster_node_pool },
    });
  }
  return null;
}
