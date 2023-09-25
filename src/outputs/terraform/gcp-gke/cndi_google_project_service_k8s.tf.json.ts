import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPProjectServiceK8sTFJSON(): string {
  const resource = getTFResource("google_project_service", {
    disable_on_destroy: false,
    service: "container.googleapis.com",
    depends_on: [
      "google_project_service.cndi_google_project_service_cloudresourcemanager",
    ],
  }, "cndi_google_project_service_k8s");
  return getPrettyJSONString(resource);
}
