import { EnvObject } from "../types.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

const prepareAzureEnv = async (interactive: boolean): Promise<EnvObject> => {
  const ARM_REGION = "eastus";
  const ARM_CLIENT_SECRET = "";
  const ARM_CLIENT_ID = "";
  const ARM_TENANT_ID = "";
  const ARM_SUBSCRIPTION_ID = "";

  const azureEnvObject: EnvObject = {};

  azureEnvObject.ARM_REGION = {
    comment: "Azure Resource Manager",
    value: interactive
      ? ((await Input.prompt({
        message: colors.cyan("Enter your Azure region:"),
        default: ARM_REGION,
      })) as string)
      : ARM_REGION,
  };

  azureEnvObject.ARM_CLIENT_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: colors.cyan("Enter your Azure Client ID:"),
        default: ARM_CLIENT_ID,
      })) as string)
      : ARM_CLIENT_ID,
  };

  azureEnvObject.ARM_CLIENT_SECRET = {
    value: interactive
      ? ((await Secret.prompt({
        message: colors.cyan("Enter your Azure Client Secret:"),
        default: ARM_CLIENT_SECRET,
      })) as string)
      : ARM_CLIENT_SECRET,
  };

  azureEnvObject.ARM_TENANT_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: colors.cyan("Enter your Azure Tenant ID:"),
        default: ARM_TENANT_ID,
      })) as string)
      : ARM_TENANT_ID,
  };

  azureEnvObject.ARM_SUBSCRIPTION_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: colors.cyan("Enter your Azure Subscription ID:"),
        default: ARM_SUBSCRIPTION_ID,
      })) as string)
      : ARM_SUBSCRIPTION_ID,
  };
  return azureEnvObject;
};

export { prepareAzureEnv };
