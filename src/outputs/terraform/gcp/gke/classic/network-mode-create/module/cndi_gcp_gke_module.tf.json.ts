import { getPrettyJSONString } from "src/utils.ts";
import { DEFAULT_K8S_VERSION } from "versions";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

const SHA_36_3_0 = "ae3c8fe842c84f0f1b4c06dabd7d2992126b80ab";

const MODULE_SOURCE =
  "git::https://github.com/terraform-google-modules/terraform-google-kubernetes-engine.git?ref=" +
  SHA_36_3_0;

export default function (cndi_config: NormalizedCNDIConfig) {
  const ip_range_pods = "cluster-pods";
  const ip_range_services = "cluster-services";
  const kubernetes_version = cndi_config?.kubernetes_version ||
    DEFAULT_K8S_VERSION;
  return getPrettyJSONString({
    module: {
      cndi_gcp_gke_module: {
        depends_on: ["time_sleep.cndi_time_sleep_services_ready"],
        source: MODULE_SOURCE,
        name: "${local.cndi_project_name}",
        service_account: "${local.cndi_gcp_client_email}",
        create_service_account: false,
        project_id: "${local.cndi_gcp_project_id}",
        region: "${local.region}",
        network: "${google_compute_network.cndi_google_compute_network.name}",
        subnetwork:
          "${google_compute_subnetwork.cndi_google_compute_subnetwork.name}",

        network_policy: true,
        filestore_csi_driver: true,

        gce_pd_csi_driver: true,
        gcs_fuse_csi_driver: true,

        deletion_protection: false,

        enable_intranode_visibility: true,
        initial_node_count: 1,
        remove_default_node_pool: true,

        // in place of ip_allocation_policy: {}
        // from original hand-crafted resource
        ip_range_pods,
        ip_range_services,

        kubernetes_version,
      },
    },
  });
}
