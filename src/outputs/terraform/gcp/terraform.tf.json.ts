import { getPrettyJSONString } from "../../../utils.ts";

export default function getGCPTerraformTFJSON() {
  return getPrettyJSONString({
    terraform: [
      {
        required_providers: [
          {
            google: {
              source: "hashicorp/google",
              version: "~> 4.44",
            },
          },
        ],
      },
    ],
  });
}
