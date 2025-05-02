import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
  // TODO: learn what this is
  const resource = {
    time_static: {
      cndi_time_static: {
        triggers: {
          argocdAdminPassword: "${var.ARGOCD_ADMIN_PASSWORD}",
        },
      },
    },
  };
  return getPrettyJSONString({ resource });
}
