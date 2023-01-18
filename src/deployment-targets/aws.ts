import { EnvObject } from "../types.ts";
import { cyan } from "https://deno.land/std@0.173.0/fmt/colors.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

const prepareAWSEnv = async (interactive: boolean): Promise<EnvObject> => {
  const AWS_REGION = "us-east-1";
  const AWS_ACCESS_KEY_ID = "";
  const AWS_SECRET_ACCESS_KEY = "";
  const awsEnvObject: EnvObject = {};

  awsEnvObject.AWS_REGION = {
    comment: "AWS",
    value: interactive
      ? ((await Input.prompt({
        message: cyan("Enter your AWS region:"),
        default: AWS_REGION,
      })) as string)
      : AWS_REGION,
  };

  awsEnvObject.AWS_ACCESS_KEY_ID = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your AWS access key ID:"),
        default: AWS_ACCESS_KEY_ID,
      })) as string)
      : AWS_ACCESS_KEY_ID,
  };

  awsEnvObject.AWS_SECRET_ACCESS_KEY = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your AWS secret access key:"),
        default: AWS_SECRET_ACCESS_KEY,
      })) as string)
      : AWS_SECRET_ACCESS_KEY,
  };
  return awsEnvObject;
};

export { prepareAWSEnv };
