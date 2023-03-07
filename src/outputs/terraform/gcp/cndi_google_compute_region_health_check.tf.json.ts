import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeHealthCheckTFJSON(): string {
  const resource = getTFResource("google_compute_region_health_check", {
    check_interval_sec: 1,
    name: "cndi-healthcheck",
    tcp_health_check: [
      {
        port: 80,
      },
    ],
    timeout_sec: 1,
    depends_on: ["google_project_service.cndi_enable_compute_service"],
  });
  return getPrettyJSONString(resource);
}
