import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

export default function (_cndi_config: CNDIConfig): string | null {
  const google_project_service = {
    cndi_google_project_service_cloudresourcemanager: {
      disable_on_destroy: false,
      service: "cloudresourcemanager.googleapis.com",
    },
    cndi_google_project_service_compute: {
      depends_on: [
        "google_project_service.cndi_google_project_service_cloudresourcemanager",
      ],
      disable_on_destroy: false,
      service: "compute.googleapis.com",
    },
    cndi_google_project_service_container: {
      depends_on: [
        "google_project_service.cndi_google_project_service_cloudresourcemanager",
      ],
      disable_on_destroy: false,
      service: "container.googleapis.com",
    },
    cndi_google_project_service_file: {
      depends_on: [
        "google_project_service.cndi_google_project_service_cloudresourcemanager",
      ],
      disable_on_destroy: false,
      service: "file.googleapis.com",
    },
  };

  return getPrettyJSONString({
    resource: {
      google_project_service,
    },
  });
}
