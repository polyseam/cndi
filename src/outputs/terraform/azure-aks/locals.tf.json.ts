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
      random_multiple_of_16:
        "${random_integer.cndi_random_integer_vnet_octet3.result*16}",
    },
  });
}
