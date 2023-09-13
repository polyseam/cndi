import { getPrettyJSONString, getTFModule } from "src/utils.ts";
import { GKENodeItemSpec } from "src/types.ts";
import { DEFAULT_NODE_DISK_SIZE } from "consts";

export default function getGCPComputeInstanceTFJSON(
  node: GKENodeItemSpec,
): string {
  const DEFAULT_MACHINE_TYPE = "n2-standard-2"; // The machine type to create.
  const machine_type = node?.machine_type || node?.instance_type ||
    DEFAULT_MACHINE_TYPE;
  const size = node?.size || node?.volume_size || DEFAULT_NODE_DISK_SIZE;
  const max_size = node?.max_count || 3;
  const min_size = node?.min_count || 1;
  const desired_size = min_size;

  const module = getTFModule(
    "gke_cluster",
    {
      create_service_account: false,
      depends_on: [
        "google_project_service.cndi_google_project_service_compute",
        "google_project_service.cndi_google_project_service_k8s",
      ],
      filestore_csi_driver: true,
      horizontal_pod_autoscaling: true,
      ip_range_pods: "k8s-pod-range",
      ip_range_services: "k8s-service-range",
      name: "${local.cndi_project_name}-cluster",
      network: "${google_compute_network.cndi_google_compute_network.name}",
      node_pools: [{
        auto_repair: true,
        auto_upgrade: true,
        autoscaling: true,
        disk_size_gb: size,
        disk_type: "pd-ssd",
        enable_secure_boot: true,
        initial_node_count: 1,
        location_policy: "BALANCED",
        machine_type: machine_type,
        max_count: max_size,
        min_count: desired_size,
        name: "worker-nodes",
        service_account: "${local.client_email}",
        tags: "${local.cndi_project_name}",
      }],
      project_id: "${local.project_id}",
      region: "${local.gcp_region}",
      remove_default_node_pool: true,
      source: "terraform-google-modules/kubernetes-engine/google",
      subnetwork:
        "${google_compute_subnetwork.cndi_google_compute_subnetwork.name}",
      zones: "${local.gcp_zones}",
    },
  );

  return getPrettyJSONString(module);
}
