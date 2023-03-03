import { getPrettyJSONString } from "../../../utils.ts";

export default function getTerraformTFJSON() {
  return getPrettyJSONString({
    terraform: [
      {
        required_providers: [
          {
            external: {
              source: "hashicorp/external",
              version: "2.2.2",
            },
          },
        ],
        required_version: ">= 1.2.0",
      },
    ],
  });
}
