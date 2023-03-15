import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
import { EnvLines } from "../types.ts";

const deploymentTargetsLabel = colors.white("src/deployment-targets/gcp:");

const getGCPEnvLines = async (interactive: boolean): Promise<EnvLines> => {
  let GCP_REGION = "us-central1";
  let GOOGLE_CREDENTIALS = "";

  GCP_REGION = interactive
    ? ((await Input.prompt({
      message: colors.cyan("Enter your GCP Region:"),
      default: GCP_REGION,
    })) as string)
    : GCP_REGION;

  if (interactive) {
    let credentials_string;

    const google_credentials_path = (
      (await Input.prompt({
        message: colors.cyan("Enter the path to your GCP credentials JSON:"),
      })) as string
    ).replace("~", homedir() || "~");

    // if path to google json key is invalid, throw an error
    try {
      credentials_string = await Deno.readTextFile(google_credentials_path);
    } catch {
      console.log(
        `${deploymentTargetsLabel} ${
          colors.brightRed(
            `No GCP JSON key file found at the provided path ${
              colors.white(
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
          colors.brightRed(
            `Invalid GCP JSON key file found at the provided path ${
              colors.white(
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

  return [
    {
      comment: "# GCP",
    },
    { value: { GCP_REGION } },
    { value: { GOOGLE_CREDENTIALS } },
  ];
};

export { getGCPEnvLines };
