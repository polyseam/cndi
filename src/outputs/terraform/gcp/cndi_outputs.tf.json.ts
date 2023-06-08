import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  const value = JSON.stringify({
    public_host:
      "${google_compute_forwarding_rule.cndi_google_compute_forwarding_rule.ip_address}",
    resource_group:
      "https://console.cloud.google.com/welcome?project=${local.project_id}",
  });

  return getPrettyJSONString({
    output: {
      value,
    },
  });
}
