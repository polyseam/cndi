import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: {
      azurerm: {
        features: {},
      },
    },
  });
}
