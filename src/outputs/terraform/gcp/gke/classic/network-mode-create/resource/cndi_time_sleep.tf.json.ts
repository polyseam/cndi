import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

type TimeSleep = { create_duration: string; depends_on: string[] };

export default function (_cndi_config: CNDIConfig) {
  const time_sleep: Record<string, TimeSleep> = {
    cndi_time_sleep: {
      create_duration: "60s",
      depends_on: [
        "module.cndi_google_project_services_module",
      ],
    },
  };
  return getPrettyJSONString({ resource: { time_sleep } });
}
