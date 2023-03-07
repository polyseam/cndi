import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeInstanceForwardingRuleTFJSON(): string {
  const resource = getTFResource("google_compute_forwarding_rule", {
    backend_service:
      "${google_compute_region_backend_service.cndi_backend_service.self_link}",
    name: "cndi-forwarding-rule",
    network_tier: "STANDARD",
    ports: ["80", "443"],
  });
  return getPrettyJSONString(resource);
}
