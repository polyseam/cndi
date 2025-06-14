import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  return getPrettyJSONString({
    data: {
      google_client_config: {
        cndi_google_client_config: {},
      },
    },
  });
}
