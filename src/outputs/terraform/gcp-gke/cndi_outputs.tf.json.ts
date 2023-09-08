import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
  return getPrettyJSONString({
    output: {
      public_host: {
        value: "${google_compute_address.cndi_google_compute_address.address}",
      },
      resource_group: {
        value:
          "https://console.cloud.google.com/welcome?project=${local.project_id}",
      },
    },
  });
}
