import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPProjectServiceComputeTFJSON(): string {
  const resource = getTFResource("google_project_service", {
    disable_on_destroy: false,
    service: "compute.googleapis.com",
    depends_on: [
      "google_project_service.cndi_enable_cloudresourcemanager_service",
    ],
  }, "cndi_google_project_service_compute");
  return getPrettyJSONString(resource);
}
