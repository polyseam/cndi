import { EnvObject } from "../types.ts";
import { cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

const prepareAzureEnv = async (interactive: boolean): Promise<EnvObject> => {
  const AZURE_REGION = "useast";
  const AZURE_CLIENT_SECRET = "";
  const AZURE_CLIENT_ID = "";
  const AZURE_TENANT_ID = "";
  const AZURE_SUBSCRIPTION_ID = "";

  const azureEnvObject: EnvObject = {};

  azureEnvObject.AZURE_REGION = {
    comment: "Azure",
    value: interactive
      ? ((await Input.prompt({
        message: cyan("Enter your Azure region:"),
        default: AZURE_REGION,
      })) as string)
      : AZURE_REGION,
  };

  azureEnvObject.AZURE_CLIENT_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your Azure Client ID:"),
        default: AZURE_CLIENT_ID,
      })) as string)
      : AZURE_CLIENT_ID,
  };

  azureEnvObject.AZURE_CLIENT_SECRET = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your Azure Client Secret:"),
        default: AZURE_CLIENT_SECRET,
      })) as string)
      : AZURE_CLIENT_SECRET,
  };

  azureEnvObject.AZURE_TENANT_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your Azure Tenant ID:"),
        default: AZURE_TENANT_ID,
      })) as string)
      : AZURE_TENANT_ID,
  };

  azureEnvObject.AZURE_SUBSCRIPTION_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your Azure Subscription ID:"),
        default: AZURE_SUBSCRIPTION_ID,
      })) as string)
      : AZURE_SUBSCRIPTION_ID,
  };
  return azureEnvObject;
};

export { prepareAzureEnv };
