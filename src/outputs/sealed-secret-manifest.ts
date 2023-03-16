import { ccolors } from "deps";
import { KubernetesSecret, KubernetesSecretWithStringData } from "src/types.ts";
import { getPathToKubesealBinary, getPrettyJSONString } from "src/utils.ts";

const CNDI_SECRETS_PREFIX = "$.cndi.secrets.";
const PLACEHOLDER_SUFFIX = "_PLACEHOLDER__";

const sealedSecretManifestLabel = ccolors.faded(
  "\nsrc/outputs/sealed-secret-manifest.ts:",
);

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

        if (secretValueIsPlaceholder || !secretEnvVal) {
          console.log(
            ccolors.warn(
              `\n\n${
                ccolors.error(
                  "ERROR",
                )
              }: ${
                ccolors.key_name(`"${secretEnvName}"`)
              } not found in environment`,
            ),
          );

          console.log(
            `You need to replace `,
            ccolors.key_name(placeholder),
            `with the desired value in`,
            ccolors.user_input(`"${dotEnvPath}"`),
            "\nthen run",
            ccolors.success(
              "cndi ow\n",
            ),
          );

          if (!secretEnvVal) {
            addSecretPlaceholder(secretEnvName, dotEnvPath);
          }
          outputSecret.isPlaceholder = true;
        } else {
          const decodedSecretEnvVal = atob(secretEnvVal);
          outputSecret.stringData[dataEntryKey] = decodedSecretEnvVal;
          outputSecret.isPlaceholder = false;
        }
      } else {
        // if we find a secret that doesn't use our special token we tell the user that using secrets without it is unsupported
        console.error(
          sealedSecretManifestLabel,
          ccolors.error("Secret string literals are not supported. Use"),
          ccolors.key_name(`"${CNDI_SECRETS_PREFIX}"`),
          ccolors.error("prefix to reference environment variables at"),
          ccolors.key_name(
            `"${inputSecret.metadata.name}.data.${dataEntryKey}"`,
          ),
          "\n",
        );
        Deno.exit(1);
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

        if (secretValueIsPlaceholder || !secretEnvVal) {
          console.log(
            ccolors.error(
              "ERROR",
            ),
            ccolors.key_name(`"${secretEnvName}"`),
            ccolors.error(`not found in environment`),
            ccolors.error("You need to replace"),
            ccolors.key_name(placeholder),
            ccolors.error("with the desired value in"),
            ccolors.user_input(`"${dotEnvPath}"`),
            ccolors.error("then run"),
            ccolors.success("cndi ow\n"),
          );
          if (!secretEnvVal) {
            addSecretPlaceholder(secretEnvName, dotEnvPath);
          }
          outputSecret.isPlaceholder = true;
        } else {
          outputSecret.stringData[dataEntryKey] = secretEnvVal;
          outputSecret.isPlaceholder = false;
        }
      } else {
        console.error(
          sealedSecretManifestLabel,
          ccolors.error("Secret string literals are not supported. Use"),
          ccolors.key_name(`"${CNDI_SECRETS_PREFIX}"`),
          ccolors.error("prefix to reference environment variables at"),
          ccolors.key_name(
            `"${inputSecret.metadata.name}.stringData.${dataEntryKey}"`,
          ),
          "\n",
        );
        Deno.exit(1);
      }
    });
  } else {
    console.error(
      sealedSecretManifestLabel,
      ccolors.error(
        `Secret`,
      ),
      ccolors.key_name(`"${inputSecret.metadata.name}"`),
      ccolors.error("has no data or stringData"),
      "\n",
    );
    Deno.exit(1);
  }
  delete outputSecret.data;
  return outputSecret;
};

// if a user passes in a cndi-config file in non-interactive mode
// we want to write placeholders for the $.cndi.secrets entries to the .env file
function addSecretPlaceholder(secretEnvName: string, dotEnvPath: string) {
  const placeholder = `${secretEnvName}${PLACEHOLDER_SUFFIX}`;
  const dotEnv = Deno.readTextFileSync(dotEnvPath);
  const dotEnvLines = dotEnv.split("\n");

  if (dotEnvLines.some((line) => line.indexOf(secretEnvName) === 0)) {
    return;
  } else {
    const secretHeading = "# Secrets";

    const needsHeading = !dotEnvLines.some((line) => line === secretHeading);

    if (needsHeading) {
      dotEnvLines.push(`\n${secretHeading}\n${secretEnvName}='${placeholder}'`);
    } else {
      dotEnvLines.push(`\n${secretEnvName}='${placeholder}'`);
    }

    Deno.writeTextFileSync(dotEnvPath, dotEnvLines.join("\n"));
  }
}

type GetSealedSecretManifestOptions = {
  publicKeyFilePath: string;
  dotEnvPath: string;
};

const getSealedSecretManifest = async (
  secret: KubernetesSecret,
  { publicKeyFilePath, dotEnvPath }: GetSealedSecretManifestOptions,
): Promise<string | null> => {
  let sealed = "";
  const pathToKubeseal = await getPathToKubesealBinary();
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
