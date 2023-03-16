import { ccolors, homedir, Input } from "deps";
import { EnvLines } from "src/types.ts";

const deploymentTargetsLabel = ccolors.faded("src/deployment-targets/gcp.ts:");

const getGCPEnvLines = async (interactive: boolean): Promise<EnvLines> => {
  let GCP_REGION = "us-central1";
  let GOOGLE_CREDENTIALS = "";

  GCP_REGION = interactive
    ? ((await Input.prompt({
      message: ccolors.prompt("Enter your GCP Region:"),
      default: GCP_REGION,
    })) as string)
    : GCP_REGION;

  if (interactive) {
    let credentials_string;

    const google_credentials_path = (
      (await Input.prompt({
        message: ccolors.prompt("Enter the path to your GCP credentials JSON:"),
      })) as string
    ).replace("~", homedir() || "~");

    // if path to google json key is invalid, throw an error
    try {
      credentials_string = await Deno.readTextFile(google_credentials_path);
    } catch (errorReadingCredentials) {
      console.log(
        `${deploymentTargetsLabel} ${
          ccolors.error(
            `No GCP JSON key file found at the provided path ${
              ccolors.user_input(
                `"${google_credentials_path}"`,
              )
            }`,
          )
        }`,
      );
      console.log(ccolors.caught(errorReadingCredentials), "\n");
      Deno.exit(1);
    }

    // if the path to google json key is valid, but the file is not a valid json, throw an error
    try {
      JSON.parse(credentials_string);
    } catch (errorParsingCredentials) {
      console.error(
        deploymentTargetsLabel,
        ccolors.error(`Invalid GCP JSON key file found at the provided path`),
        ccolors.user_input(`"${google_credentials_path}"`),
      );
      console.log(ccolors.caught(errorParsingCredentials), "\n");
      Deno.exit(1);
    }

    // if the path to google json key is valid, and the file is a valid json, write the GOOGLE_CREDENTIALS env variable
    GOOGLE_CREDENTIALS = credentials_string;
  }

  return [
    {
      comment: "GCP",
    },
    { value: { GCP_REGION } },
    { value: { GOOGLE_CREDENTIALS } },
  ];
};

export { getGCPEnvLines };
