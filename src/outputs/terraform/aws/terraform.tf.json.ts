import { getPrettyJSONString } from "../../../utils.ts";

export default function getAWSTerraformTFJSON() {
  return getPrettyJSONString({
    terraform: [
      {
        required_providers: [
          {
            aws: {
              source: "hashicorp/aws",
              version: "~> 4.16",
            },
          },
        ],
      },
    ],
  });
}
