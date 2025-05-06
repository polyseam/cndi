import {
  getPrettyJSONString,
  getTaintEffectForDistribution,
} from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

interface GOOGLE_CONTAINER_NODE_POOL {
  cluster: string;
  name: string;
  autoscaling: {
    min_node_count: number;
    max_node_count: number;
  };
  management: {
    auto_repair: boolean;
    auto_upgrade: boolean;
  };
  node_config: {
    disk_type: string;
    disk_size_gb: number;
    labels: Record<string, string>;
    machine_type: string;
    taint: Array<{
      key: string;
      value: string;
      effect: string;
    }>;
    workload_metadata_config: {
      mode: string;
    };
  };
}

export default function (cndi_config: CNDIConfig) {
  const google_container_node_pool: Record<string, GOOGLE_CONTAINER_NODE_POOL> =
    {};

  if (cndi_config.infrastructure.cndi.nodes as unknown !== "automatic") {
    // original non-automatic node group
    let i = 0;

    const cluster =
      "${google_container_cluster.cndi_google_container_cluster.name}";
    for (const nodeSpec of cndi_config.infrastructure.cndi.nodes) {
      const key = `cndi_google_container_node_pool_${i}`;
      const count = nodeSpec?.count || 1;

      // reduce user intent to scaling configuration
      // count /should/ never be assigned alongside min_count or max_count

      const { min_count, max_count, name } = nodeSpec;

      const machine_type = nodeSpec?.machine_type || nodeSpec?.instance_type ||
        DEFAULT_INSTANCE_TYPES.gcp;

      const labels = nodeSpec.labels || {};

      const taint = nodeSpec.taints?.map((taint) => ({
        key: taint.key,
        value: taint.value,
        effect: getTaintEffectForDistribution(taint.effect, "gke"), // taint.effect must be valid by now
      })) || [];

      const disk_size_gb = nodeSpec?.volume_size ||
        nodeSpec?.disk_size ||
        nodeSpec?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE_MANAGED;

      const disk_type = nodeSpec?.disk_type || "pd-ssd";

      google_container_node_pool[key] = {
        cluster,
        name,
        management: {
          auto_repair: true,
          auto_upgrade: true,
        },
        autoscaling: {
          min_node_count: min_count ?? count,
          max_node_count: max_count ?? count,
        },
        node_config: {
          disk_type,
          disk_size_gb,
          labels,
          machine_type,
          taint,
          workload_metadata_config: {
            mode: "GCE_METADATA",
          },
        },
      };

      i++;
    }
  } else {
    // automatic node group
  }

  return getPrettyJSONString({
    resource: {
      google_container_node_pool,
    },
  });
}
