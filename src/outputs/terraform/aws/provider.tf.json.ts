import { AwsProvider } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/provider";
import { getPrettyJSONString } from "src/utils.ts";

export default function getProviderAws(
  scope: any,
  id: string,
  options: { region: string },
): AwsProvider {
  return new AwsProvider(scope, id, {
    region: options.region,
  });
}
