import { getPrettyJSONString } from "src/utils.ts";

interface GetAzureProviderTFJSONArg {
  region: string;
}

export default function getAzureProviderTFJSON(
  options: GetAzureProviderTFJSONArg,
): string {
  const { region } = options;

  return getPrettyJSONString({
    provider: {
      azure: {
        region,
      },
    },
  });
}
