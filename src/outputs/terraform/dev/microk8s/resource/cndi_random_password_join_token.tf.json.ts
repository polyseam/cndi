import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const resource = {
    random_password: {
      cndi_random_password_join_token: {
        length: 32,
        special: false,
        upper: false,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
