import { getPrettyJSONString } from "src/utils.ts";


export default function getAzureProviderTFJSON(
): string {
  return getPrettyJSONString({
    provider: {
      azure: {
        features: {}
      },
    },
  });
}
