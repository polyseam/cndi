import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPProjectServiceFileTFJSON(): string {
  const resource = getTFResource(
    "google_project_service",
    {
      disable_on_destroy: false,
      service: "file.googleapis.com",
      depends_on: [
        "google_project_service.cndi_google_project_service_cloudresourcemanager",
      ],
    },
    "cndi_google_project_service_file",
  );
  return getPrettyJSONString(resource);
}
