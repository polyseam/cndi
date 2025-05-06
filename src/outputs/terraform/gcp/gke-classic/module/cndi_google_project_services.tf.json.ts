import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

const MODULE_SOURCE =
  "terraform-google-modules/project-factory/google//modules/project_services";

export default function (_cndi_config: CNDIConfig): string | null {
  return getPrettyJSONString({
    module: {
      cndi_google_project_services_module: {
        version: "~> 18.0",
        source: MODULE_SOURCE,
        project_id: "${local.gcp_project_id}",
        disable_services_on_destroy: true,
        activate_apis: [
          "cloudresourcemanager.googleapis.com",
          "file.googleapis.com",
          "compute.googleapis.com",
          "container.googleapis.com",
        ],
      },
    },
  });
}
