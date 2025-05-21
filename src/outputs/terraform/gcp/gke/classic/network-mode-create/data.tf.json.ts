import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
  return getPrettyJSONString({
    data: {
      google_client_config: {
        cndi_google_client_config: {},
      },
    },
  });
}
