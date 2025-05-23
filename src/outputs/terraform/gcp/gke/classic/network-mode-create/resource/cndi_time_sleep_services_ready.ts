import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

export default function (_cndi_config: CNDIConfig): string | null {
  const time_sleep = {
    cndi_time_sleep_services_ready: {
      create_duration: "60s",
      depends_on: [
        "google_project_service.cndi_google_project_service_cloudresourcemanager",
        "google_project_service.cndi_google_project_service_compute",
        "google_project_service.cndi_google_project_service_container",
        "google_project_service.cndi_google_project_service_file",
      ],
    },
  };

  return getPrettyJSONString({
    resource: {
      time_sleep,
    },
  });
}
