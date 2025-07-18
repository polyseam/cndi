import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  // TODO: learn what this is
  const resource = {
    time_static: {
      cndi_time_static_argocd_admin_password: {
        triggers: {
          argocdAdminPassword: "${var.ARGOCD_ADMIN_PASSWORD}",
        },
      },
    },
  };
  return getPrettyJSONString({ resource });
}
