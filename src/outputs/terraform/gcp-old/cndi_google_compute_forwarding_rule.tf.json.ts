import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "../../../types.ts";

export default function getGCPComputeInstanceForwardingRuleTFJSON(
  p: Array<CNDIPort>,
): string {
  const ports = p.map(({ number }) => `${number}`);

  const resource = getTFResource("google_compute_forwarding_rule", {
    backend_service:
      "${google_compute_region_backend_service.cndi_google_compute_region_backend_service.self_link}",
    name: "cndi-forwarding-rule",
    network_tier: "STANDARD",
    ports,
  });
  return getPrettyJSONString(resource);
}
