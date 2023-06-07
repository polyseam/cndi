import { getPrettyJSONString } from "src/utils.ts";

export default function getOutputTFJSON(): string {
    
  const value = JSON.stringify({
    public_host: "${}", // TODO: Add public host
    resource_group:
      "https://console.cloud.google.com/welcome?project=${local.project_id}",
  });

  return getPrettyJSONString({
    output: {
      value,
    },
  });
}
