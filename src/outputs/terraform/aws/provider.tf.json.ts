import { getPrettyJSONString } from "src/utils.ts";

interface GetAWSProviderTFJSONArg {
  region: string;
}

export default function getAWSComputeEngineProviderTFJSON(
  options: GetAWSProviderTFJSONArg,
): string {
  const { region } = options;

  return getPrettyJSONString({
    provider: {
      aws: {
        region,
      },
    },
  });
}
