import { CNDIConfig, CNDINodeSpec } from "src/types.ts";
import {
  getPrettyJSONString,
  getTaintEffectForDistribution,
} from "src/utils.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

export interface AzurermKubernetesClusterDefaultNodePool {
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
  type: "VirtualMachineScaleSets" | "AvailabilitySet";
  vm_size: string;
  vnet_subnet_id: string;
  zones: string[];
}

export interface AzurermKubernetesClusterNodePool extends
  Omit<
    AzurermKubernetesClusterDefaultNodePool,
    "temporary_name_for_rotation"
  > {
  node_taints: string[];
  kubernetes_cluster_id: string;
}

export function getNodePools(
  cndi_config: CNDIConfig,
): [
  AzurermKubernetesClusterDefaultNodePool,
  ...AzurermKubernetesClusterNodePool[],
] {
  const [default_node_pool, ...azurerm_kubernetes_cluster_node_pool] =
    cndi_config.infrastructure.cndi.nodes.map(
      (nodeSpec: CNDINodeSpec, index) => {
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

        const pool:
          | AzurermKubernetesClusterNodePool
          | AzurermKubernetesClusterDefaultNodePool = {
            name,
            type: "VirtualMachineScaleSets",
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
            vnet_subnet_id: "${azurerm_subnet.cndi_azurerm_subnet.id}",
            zones: ["1"],
          };

        if (!index) {
          pool.temporary_name_for_rotation = "temp0";
          return pool as AzurermKubernetesClusterDefaultNodePool;
        } else {
          const node_taints = nodeSpec.taints?.map((taint) =>
            `${taint.key}=${taint.value}:${
              getTaintEffectForDistribution(taint.effect, "aks")
            }` // taint.effect must be valid by now
          ) || [];
          return {
            ...pool,
            kubernetes_cluster_id: "${module.cndi_azurerm_aks_module.aks_id}",
            node_taints,
          } as AzurermKubernetesClusterNodePool;
        }
      },
    );
  return [
    default_node_pool,
    ...azurerm_kubernetes_cluster_node_pool,
  ] as [
    AzurermKubernetesClusterDefaultNodePool,
    ...AzurermKubernetesClusterNodePool[],
  ];
}

export default function (cndi_config: CNDIConfig) {
  const [_, ...cndi_azurerm_kubernetes_cluster_node_pool] = getNodePools(
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
