import { ccolors, Input, Secret } from "deps";
import { EnvLines } from "src/types.ts";

const getAzureEnvLines = async (interactive: boolean): Promise<EnvLines> => {
  let ARM_REGION = "eastus";
  let ARM_CLIENT_SECRET = "";
  let ARM_CLIENT_ID = "";
  let ARM_TENANT_ID = "";
  let ARM_SUBSCRIPTION_ID = "";

  ARM_REGION = interactive
    ? ((await Input.prompt({
      message: ccolors.prompt("Enter your Azure region:"),
      default: ARM_REGION,
    })) as string)
    : ARM_REGION;

  ARM_CLIENT_ID = interactive
    ? ((await Secret.prompt({
      message: ccolors.prompt("Enter your Azure Client ID:"),
      default: ARM_CLIENT_ID,
    })) as string)
    : ARM_CLIENT_ID;

  ARM_CLIENT_SECRET = interactive
    ? ((await Secret.prompt({
      message: ccolors.prompt("Enter your Azure Client Secret:"),
      default: ARM_CLIENT_SECRET,
    })) as string)
    : ARM_CLIENT_SECRET;

  ARM_TENANT_ID = interactive
    ? ((await Secret.prompt({
      message: ccolors.prompt("Enter your Azure Tenant ID:"),
      default: ARM_TENANT_ID,
    })) as string)
    : ARM_TENANT_ID;

  ARM_SUBSCRIPTION_ID = interactive
    ? ((await Secret.prompt({
      message: ccolors.prompt("Enter your Azure Subscription ID:"),
      default: ARM_SUBSCRIPTION_ID,
    })) as string)
    : ARM_SUBSCRIPTION_ID;

  return [
    { comment: "Azure Resource Manager" },
    { value: { ARM_REGION } },
    { value: { ARM_CLIENT_ID } },
    { value: { ARM_CLIENT_SECRET } },
    { value: { ARM_TENANT_ID } },
    { value: { ARM_SUBSCRIPTION_ID } },
  ];
};

export { getAzureEnvLines };
