import { getPrettyJSONString } from "src/utils.ts";

interface GetAzureLocalsTFJSONArg {
  azure_location: string;
}

export default function getAzureLocalsTFJSON({
  azure_location,
}: GetAzureLocalsTFJSONArg): string {
  return getPrettyJSONString({
    locals: {
      azure_location,
    },
  });
}
