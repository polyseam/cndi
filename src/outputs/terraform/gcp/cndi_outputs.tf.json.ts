import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      public_host: {
        value:
          "${google_compute_forwarding_rule.cndi_google_compute_forwarding_rule.ip_address}",
      },
      resource_group: {
        value:
          "https://console.cloud.google.com/welcome?project=${local.project_id}",
      },
    },
  });
}
