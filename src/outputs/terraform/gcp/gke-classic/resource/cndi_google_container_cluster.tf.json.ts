import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AddonConfig {
  enabled: boolean;
}

type GOOGLE_CONTAINER_CLUSTER = {
  name: string;
  project: string;
  network: string;
  subnetwork: string;
  location: string;
  node_locations: string[];
  addons_config: Record<string, AddonConfig>;
  deletion_protection: boolean;
  enable_intranode_visibility: boolean;
  initial_node_count: number;
  ip_allocation_policy: Record<string, unknown>;

  network_policy: {
    enabled: boolean;
  };

  node_config: {
    shielded_instance_config: {
      enable_integrity_monitoring: boolean;
      enable_secure_boot: boolean;
    };
    workload_metadata_config: {
      mode: string;
    };
  };

  private_cluster_config: {
    enable_private_nodes: boolean;
  };

  release_channel: {
    channel: string;
  };
  remove_default_node_pool: boolean;
  resource_labels: Record<string, string>;
};

export default function (_cndi_config: CNDIConfig) {
  const google_container_cluster: Record<string, GOOGLE_CONTAINER_CLUSTER> = {
    cndi_google_container_cluster: {
      "addons_config": {
        "gce_persistent_disk_csi_driver_config": {
          "enabled": true,
        },
        "gcp_filestore_csi_driver_config": {
          "enabled": true,
        },
        "gcs_fuse_csi_driver_config": {
          "enabled": false,
        },
      },
      "deletion_protection": false,
      "enable_intranode_visibility": true,
      "initial_node_count": 1,
      "ip_allocation_policy": {},
      "location": "${local.gcp_region}",
      "name": "${local.cndi_project_name}",
      "network":
        "${google_compute_network.cndi_google_compute_network.self_link}",
      "network_policy": {
        "enabled": true,
      },
      "node_config": {
        "shielded_instance_config": {
          "enable_integrity_monitoring": true,
          "enable_secure_boot": true,
        },
        "workload_metadata_config": {
          "mode": "GCE_METADATA",
        },
      },
      "node_locations": [
        "${local.gcp_zone}",
      ],
      "private_cluster_config": {
        "enable_private_nodes": false,
      },
      "project": "${local.project_id}",
      "release_channel": {
        "channel": "REGULAR",
      },
      "remove_default_node_pool": true,
      "resource_labels": {
        "cndi_project": "${local.cndi_project_name}",
      },
      "subnetwork":
        "${google_compute_subnetwork.cndi_google_compute_subnetwork.self_link}",
    },
  };

  return getPrettyJSONString({
    resource: {
      google_container_cluster,
    },
  });
}
