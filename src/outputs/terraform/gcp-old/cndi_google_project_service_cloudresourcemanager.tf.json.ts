import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPProjectServiceCloudResourceManagerTFJSON(): string {
  const resource = getTFResource(
    "google_project_service",
    {
      disable_on_destroy: false,
      service: "cloudresourcemanager.googleapis.com",
    },
    "cndi_google_project_service_cloudresourcemanager",
  );
  return getPrettyJSONString(resource);
}
