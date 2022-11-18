import {
  CNDIContext,
  KubernetesSecret,
  KubernetesSecretWithStringData,
} from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";
import {
  brightRed,
  cyan,
  yellow,
} from "https://deno.land/std@0.158.0/fmt/colors.ts";

const CNDI_SECRETS_PREFIX = "$.cndi.secrets.";
const PLACEHOLDER_SUFFIX = "_PLACEHOLDER__";

const parseCndiSecret = (
  inputSecret: KubernetesSecret,
  dotEnvPath: string,
): KubernetesSecretWithStringData => {
  // convert secret.data to secret.stringData
  const outputSecret = {
    stringData: {},
    ...inputSecret,
  };

  // TODO: Refactor this to be more readable and less redundant
  // If the user supplies a secret manifest in the cluster section of the config file, we need to pluck the value from the environment
  // if the secret has not been set by the user we need to tell them to update their .env file

  // this block is specifically for a secret that does not use the stringData field and instead uses base64 encoded data
  if (inputSecret.data) {
    Object.entries(inputSecret.data).forEach((dataEntry) => {
      const [dataEntryKey, dataEntryValue] = dataEntry;

      // if we recognize our special token we use the value from the environment
      if (dataEntryValue.indexOf(CNDI_SECRETS_PREFIX) === 0) {
        const secretEnvName = dataEntryValue.replace(CNDI_SECRETS_PREFIX, "");
        const placeholder = `${secretEnvName}${PLACEHOLDER_SUFFIX}`;
        const secretEnvVal = Deno.env.get(secretEnvName);

        const secretValueIsPlaceholder = secretEnvVal === placeholder;

        // if the secret is a placeholder or undefined we need to tell the user to update their .env file
        if (secretValueIsPlaceholder) {
          console.log(
            yellow(
              `\n\n${
                brightRed(
                  "ERROR",
                )
              }: ${secretEnvName} not found in environment`,
            ),
          );
          console.log(
            `You need to replace `,
            cyan(placeholder),
            `with the desired value in "${dotEnvPath}"\n`,
          );
          outputSecret.isPlaceholder = true;
        } else if (!secretEnvVal) {
          console.log(
            yellow(
              `\n\n${
                brightRed(
                  "ERROR",
                )
              }: ${secretEnvName} not found in environment`,
            ),
          );
          console.log(
            `You need to add a value for ${
              cyan(
                secretEnvName,
              )
            } in "${dotEnvPath}"\n`,
          );
          outputSecret.isPlaceholder = true;
        } else {
          const decodedSecretEnvVal = atob(secretEnvVal);
          outputSecret.stringData[dataEntryKey] = decodedSecretEnvVal;
          outputSecret.isPlaceholder = false;
        }
      } else {
        // if we find a secret that doesn't use our special token we tell the user that using secrets without it is unsupported
        throw new Error(
          `Secret string literals are not supported. Use "${CNDI_SECRETS_PREFIX}" prefix to reference environment variables.\n at ${inputSecret.metadata.name}.stringData.${dataEntryKey}`,
        );
      }
    });

    // This block is specifically for a secret that uses the stringData field instead of base64 encoded data
    // we basically do the same thing as above, but we don't need to decode the secret value
  } else if (inputSecret.stringData) {
    Object.entries(inputSecret.stringData).forEach((dataEntry) => {
      const [dataEntryKey, dataEntryValue] = dataEntry;
      if (dataEntryValue.indexOf(CNDI_SECRETS_PREFIX) === 0) {
        const secretEnvName = dataEntryValue.replace(CNDI_SECRETS_PREFIX, "");
        const placeholder = `${secretEnvName}${PLACEHOLDER_SUFFIX}`;
        const secretEnvVal = Deno.env.get(secretEnvName);

        const secretValueIsPlaceholder = secretEnvVal === placeholder;

        if (secretValueIsPlaceholder) {
          console.log(
            yellow(
              `\n\n${
                brightRed(
                  "ERROR",
                )
              }: ${secretEnvName} not found in environment`,
            ),
          );
          console.log(
            `You need to replace `,
            cyan(placeholder),
            `with the desired value in "${dotEnvPath}"\n`,
          );
          outputSecret.isPlaceholder = true;
        } else if (!secretEnvVal) {
          console.log(
            yellow(
              `\n\n${
                brightRed(
                  "ERROR",
                )
              }: ${secretEnvName} not found in environment`,
            ),
          );
          console.log(
            `You need to add a value for ${
              cyan(
                secretEnvName,
              )
            } in "${dotEnvPath}"\n`,
          );
          outputSecret.isPlaceholder = true;
        } else {
          const decodedSecretEnvVal = atob(secretEnvVal);
          outputSecret.stringData[dataEntryKey] = decodedSecretEnvVal;
          outputSecret.isPlaceholder = false;
        }
      } else {
        throw new Error(
          `Secret string literals are not supported. Use "${CNDI_SECRETS_PREFIX}" prefix to reference environment variables.\n at ${inputSecret.metadata.name}.stringData.${dataEntryKey}`,
        );
      }
    });
  } else {
    throw new Error(
      `Secret "${inputSecret.metadata.name}" has no data or stringData`,
    );
  }
  delete outputSecret.data;
  return outputSecret;
};

const getSealedSecretManifest = async (
  secret: KubernetesSecret,
  publicKeyFilePath: string,
  { pathToKubeseal, dotEnvPath }: CNDIContext,
): Promise<string | null> => {
  let sealed = "";
  const secretPath = await Deno.makeTempFile();

  const secretWithStringData = parseCndiSecret(secret, dotEnvPath);

  // if the secret is just a placeholder we don't want to seal it
  if (secretWithStringData.isPlaceholder) {
    return null;
  }

  await Deno.writeTextFile(
    secretPath,
    getPrettyJSONString(secretWithStringData),
    {
      create: true,
      mode: 0o777,
    },
  );

  const cmd = [
    pathToKubeseal,
    `--cert=${publicKeyFilePath}`,
    `--secret-file=${secretPath}`,
    `--scope=cluster-wide`,
  ];

  const ranKubeseal = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  const ranKubesealStatus = await ranKubeseal.status();
  const ranKubesealOutput = await ranKubeseal.output();
  const ranKubesealStderr = await ranKubeseal.stderrOutput();

  if (ranKubesealStatus.code !== 0) {
    console.log("kubeseal failed");
    Deno.stdout.write(ranKubesealStderr);
    Deno.exit(332); // arbitrary exit code
  } else {
    // Deno.stdout.write(ranKubesealOutput);
    sealed = new TextDecoder().decode(ranKubesealOutput);
  }
  return sealed;
};

export default getSealedSecretManifest;
