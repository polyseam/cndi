import {
  brightRed,
  cyan,
  green,
  white,
  yellow,
} from "https://deno.land/std@0.173.0/fmt/colors.ts";
import { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { CNDIContext, EnvObject } from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

import { stageFileSync } from "../utils.ts";

const deploymentTargetsLabel = white("deployment-targets/gcp:");

const GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY =
  "GCP_PATH_TO_SERVICE_ACCOUNT_KEY";
const GOOGLE_CREDENTIALS_ENVKEY = "GOOGLE_CREDENTIALS";

// pull contents of the gcp service account key file into the env, and write them to .env
const getEnvStringWithGoogleCredentials = (
  context: CNDIContext,
): string | void => {
  const { projectDirectory } = context;

  const dotEnvPath = path.join(projectDirectory, ".env");

  const gcp_path_to_service_account_key = Deno.env.get(
    GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY,
  );

  const google_credentials = Deno.env.get(GOOGLE_CREDENTIALS_ENVKEY);

  const shouldAttemptToLoadKey = !google_credentials &&
    gcp_path_to_service_account_key;
  const pathToKeyAndCredentialsMissing = !gcp_path_to_service_account_key &&
    !google_credentials;

  // if the user interactively provides a path to a service account key, we copy it to `.env` and discard the path
  if (shouldAttemptToLoadKey) {
    try {
      const keyText = Deno.readTextFileSync(
        gcp_path_to_service_account_key.replace("~", homedir() || "~"),
      );

      // we were successfully able to read a file at the path provided by the user
      if (keyText) {
        // load the contents of `.env`
        const dotEnvContents = Deno.readTextFileSync(dotEnvPath);

        // break the file into an array of lines
        const dotEnvLines = dotEnvContents.split("\n");

        // find the line where the "GCP_PATH_TO_SERVICE_ACCOUNT_KEY" is defined eg. "GCP_PATH_TO_SERVICE_ACCOUNT_KEY=/path/to/key.json"
        // and replace the line that has the path with the a line that has the contents of the service account key
        const newDotEnvLines = dotEnvLines.map((line) => {
          if (line.indexOf(GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY) === 0) {
            const keyTextMinified = keyText.replaceAll("\n", " ");
            Deno.env.set(GOOGLE_CREDENTIALS_ENVKEY, keyTextMinified);
            return `# ${GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY}=${gcp_path_to_service_account_key}\n${GOOGLE_CREDENTIALS_ENVKEY}=${keyTextMinified}`; // eg. GOOGLE_CREDENTIALS="{"project_id":"my-project-id"...}"
          }
          return line;
        });

        // join the array of lines back into a string
        const newDotEnvContents = newDotEnvLines.join("\n");
        return newDotEnvContents;
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // if the user provided a path to a service account key, but we couldn't find a file at that path

        const PLACEHOLDER_SUFFIX = "_PLACEHOLDER__";
        const placeholderPathVal =
          `${GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY}${PLACEHOLDER_SUFFIX}`;

        // check if the value is the default value uninitialized variables
        if (gcp_path_to_service_account_key === placeholderPathVal) {
          console.log(
            yellow(
              `\n\n${
                brightRed(
                  "ERROR",
                )
              }: ${GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY} not found in environment`,
            ),
          );
          console.log(
            `You need to replace `,
            cyan(placeholderPathVal),
            `with the desired value in "${dotEnvPath}"\nthen run ${
              green("cndi ow")
            }\n`,
          );
        } else {
          // if the path was provided by the user, but we couldn't find a file at that path and it was not the default value
          // raise the error
          console.log(
            deploymentTargetsLabel,
            brightRed(`GCP Service Account Key not found at path:`),
            `"${gcp_path_to_service_account_key}"`,
          );
        }
      } else {
        console.log(
          deploymentTargetsLabel,
          brightRed(`Unhandled error reading GCP Service Account Key:`),
        );
        console.log(error);
      }
    }
  } else if (pathToKeyAndCredentialsMissing) {
    console.log(
      deploymentTargetsLabel,
      brightRed(`you need to have either`),
      `\"${GCP_PATH_TO_SERVICE_ACCOUNT_KEY_ENVKEY}\"`,
      brightRed("or"),
      `\"${GOOGLE_CREDENTIALS_ENVKEY}\"`,
      brightRed(`defined in the environment when depolying to "gcp"`),
    );
  }
};

const prepareGCPEnv = async (interactive: boolean): Promise<EnvObject> => {
  const GCP_REGION = "us-central1";
  const GCP_PATH_TO_SERVICE_ACCOUNT_KEY = "";

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

  gcpEnvObject.GCP_PATH_TO_SERVICE_ACCOUNT_KEY = {
    value: interactive
      ? ((await Input.prompt({
        message: cyan("Enter the path to your GCP service account key json:"),
        default: GCP_PATH_TO_SERVICE_ACCOUNT_KEY,
      })) as string)
      : GCP_PATH_TO_SERVICE_ACCOUNT_KEY,
  };

  return gcpEnvObject;
};

export { getEnvStringWithGoogleCredentials, prepareGCPEnv };
