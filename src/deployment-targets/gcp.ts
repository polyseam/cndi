import {
  brightRed,
  cyan,
  white,
} from "https://deno.land/std@0.173.0/fmt/colors.ts";
import { EnvObject } from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
// import { wrapMultilineEnv } from "../utils.ts";

const deploymentTargetsLabel = white("deployment-targets/gcp:");

const prepareGCPEnv = async (interactive: boolean): Promise<EnvObject> => {
  const GCP_REGION = "us-central1";
  let GOOGLE_CREDENTIALS = "";

  const gcpEnvObject: EnvObject = {};

  gcpEnvObject.GCP_REGION = {
    comment: "GCP",
    value: interactive
      ? ((await Input.prompt({
        message: cyan("Enter your GCP Region:"),
        default: GCP_REGION,
      })) as string)
      : GCP_REGION,
  };

  if (interactive) {
    let credentials_string;

    const google_credentials_path = (
      (await Input.prompt({
        message: cyan("Enter the path to your GCP credentials JSON:"),
      })) as string
    ).replace("~", homedir() || "~");

    // if path to google json key is invalid, throw an error
    try {
      credentials_string = await Deno.readTextFile(google_credentials_path);
    } catch {
      console.log(
        `${deploymentTargetsLabel} ${
          brightRed(
            `No GCP JSON key file found at the provided path ${
              white(
                `\"${google_credentials_path}\"`,
              )
            }`,
          )
        }`,
      );
      Deno.exit(1);
    }

    // if the path to google json key is valid, but the file is not a valid json, throw an error
    try {
      JSON.parse(credentials_string);
    } catch {
      console.log(
        `${deploymentTargetsLabel} ${
          brightRed(
            `Invalid GCP JSON key file found at the provided path ${
              white(
                `\"${google_credentials_path}\"`,
              )
            }`,
          )
        }`,
      );
      Deno.exit(1);
    }

    // if the path to google json key is valid, and the file is a valid json, write the GOOGLE_CREDENTIALS env variable
    GOOGLE_CREDENTIALS = credentials_string;
  }

  gcpEnvObject.GOOGLE_CREDENTIALS = { value: GOOGLE_CREDENTIALS };

  return gcpEnvObject;
};

export { prepareGCPEnv };
