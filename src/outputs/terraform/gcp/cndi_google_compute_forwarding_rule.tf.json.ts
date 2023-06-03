import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "../../../types.ts";

export default function getGCPComputeInstanceForwardingRuleTFJSON(
  user_ports: Array<CNDIPort>,
): string {
  const ports = ["80", "443"];

  user_ports.forEach((port) => {
    ports.push(`${port.number}`);
  });

  const resource = getTFResource("google_compute_forwarding_rule", {
    backend_service:
      "${google_compute_region_backend_service.cndi_google_compute_region_backend_service.self_link}",
    name: "cndi-forwarding-rule",
    network_tier: "STANDARD",
    ports,
  });
  return getPrettyJSONString(resource);
}
