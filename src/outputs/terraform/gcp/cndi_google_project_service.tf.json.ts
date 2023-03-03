import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPProjectServiceTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      google_project_service: {
        cndi_google_project_service_cloudresourcemanager: {
          disable_on_destroy: false,
          service: "cloudresourcemanager.googleapis.com",
          depends_on: [],
        },
        cndi_google_project_service_compute: {
          disable_on_destroy: false,
          service: "compute.googleapis.com",
          depends_on: [
            "google_project_service.cndi_enable_cloudresourcemanager_service",
          ],
        },
      },
    },
  });
}
