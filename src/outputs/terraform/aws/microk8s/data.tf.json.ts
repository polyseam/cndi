import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  return getPrettyJSONString({
    data: {
      aws_availability_zones: {
        "available-zones": {
          filter: [
            {
              name: "opt-in-status",
              values: ["opt-in-not-required"],
            },
          ],
          state: "available",
        },
      },
    },
  });
}
