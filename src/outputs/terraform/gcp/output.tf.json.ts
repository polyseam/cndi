import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPLBIPTFJSON(): string {
  return getPrettyJSONString({
    output: {
      gcp_load_balancer_ip_address: {
        value:
          "${google_compute_forwarding_rule.cndi_google_compute_forwarding_rule.ip_address}",
      },
    },
  });
}
