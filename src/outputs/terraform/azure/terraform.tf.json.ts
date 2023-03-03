import { getPrettyJSONString } from "../../../utils.ts";

export default function getAzureTerraformTFJSON() {
  return getPrettyJSONString({
    terraform: [
      {
        required_providers: [
          {
            azurerm: {
              source: "hashicorp/azurerm",
              version: "~> 3.0.2",
            },
          },
        ],
      },
    ],
  });
}
