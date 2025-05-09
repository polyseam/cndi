import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface TIME_SLEEP {
  create_duration: string;
  depends_on: string[];
}

export default function (_cndi_config: CNDIConfig) {
  const time_sleep: Record<string, TIME_SLEEP> = {
    cndi_time_sleep: {
      create_duration: "60s",
      depends_on: [
        "module.cndi_google_project_services_module",
      ],
    },
  };

  return getPrettyJSONString({
    resource: {
      time_sleep,
    },
  });
}
