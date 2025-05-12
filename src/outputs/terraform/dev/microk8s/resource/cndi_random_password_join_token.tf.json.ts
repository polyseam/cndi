import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
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
