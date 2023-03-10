import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeRegionBackendServiceTFJSON(): string {
  const resource = getTFResource("google_compute_region_backend_service", {
    backend: [
      {
        group:
          "${google_compute_instance_group.cndi_google_compute_instance_group.self_link}",
      },
    ],
    health_checks: [
      "${google_compute_region_health_check.cndi_google_compute_region_health_check.self_link}",
    ],
    load_balancing_scheme: "EXTERNAL",
    name: "cndi-backend-service",
    port_name: "http",
    protocol: "TCP",
  });
  return getPrettyJSONString(resource);
}
