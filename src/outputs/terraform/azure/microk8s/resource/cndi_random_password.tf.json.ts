import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const random_password = {
    cndi_join_token: {
      length: 32,
      special: false,
    },
  };

  return getPrettyJSONString({ resource: { random_password } });
}
