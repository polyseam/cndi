import { ccolors, platform } from "deps";
import { KubernetesSecret, KubernetesSecretWithStringData } from "src/types.ts";
import {
  getPathToKubesealBinary,
  getYAMLString,
  sha256Digest,
} from "src/utils.ts";

const CNDI_SECRETS_PREFIX = "$cndi_on_ow.seal_secret_from_env_var(";
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
    for (const dataEntry of Object.entries(inputSecret.data)) {
      const [dataEntryKey, dataEntryValue] = dataEntry;

      // if we recognize our special token we use the value from the environment
      if (dataEntryValue.indexOf(CNDI_SECRETS_PREFIX) === 0) {
        const secretEnvName = dataEntryValue.replace(CNDI_SECRETS_PREFIX, "")
          .replace(")", "");
        const placeholder = `__${secretEnvName}${PLACEHOLDER_SUFFIX}`;
        const secretEnvVal = Deno.env.get(secretEnvName);

        const secretValueIsPlaceholder = secretEnvVal === placeholder;

        if (secretValueIsPlaceholder || !secretEnvVal) {
          console.error(
            ccolors.warn(
              `\n\n${
                ccolors.error(
                  "IMPORTANT",
                )
              }: ${
                ccolors.key_name(`"${secretEnvName}"`)
              } not found in environment`,
            ),
          );

          console.error(
            `You need to replace`,
            ccolors.key_name(placeholder),
            `\nwith the desired value in`,
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
        throw new Error(
          [
            sealedSecretManifestLabel,
            ccolors.error("Secret string literals are not supported.\nUse"),
            ccolors.key_name(
              `"${CNDI_SECRETS_PREFIX}YOUR_SECRET_ENV_VAR_NAME)"`,
            ),
            ccolors.error("to reference environment variables at"),
            ccolors.key_name(
              `"${inputSecret.metadata.name}.data.${dataEntryKey}"`,
            ),
          ].join(" "),
          {
            cause: 700,
          },
        );
      }
    }

    // This block is specifically for a secret that uses the stringData field instead of base64 encoded data
    // we basically do the same thing as above, but we don't need to decode the secret value
  } else if (inputSecret.stringData) {
    for (const dataEntry of Object.entries(inputSecret.stringData)) {
      const [dataEntryKey, dataEntryValue] = dataEntry;

      if (dataEntryValue.indexOf(CNDI_SECRETS_PREFIX) === 0) {
        const secretEnvName = dataEntryValue.replace(CNDI_SECRETS_PREFIX, "")
          .replace(")", "");
        const placeholder = `__${secretEnvName}${PLACEHOLDER_SUFFIX}`;
        const secretEnvVal = Deno.env.get(secretEnvName);

        const secretValueIsPlaceholder = secretEnvVal === placeholder;

        if (secretValueIsPlaceholder || !secretEnvVal) {
          console.error(
            sealedSecretManifestLabel,
            ccolors.error(
              "IMPORTANT",
            ),
            ccolors.key_name(`"${secretEnvName}"`),
            ccolors.warn("not found in environment"),
          );
          console.error(
            ccolors.warn(`You need to replace`),
            ccolors.key_name(placeholder),
            ccolors.warn("with the desired value in"),
            ccolors.user_input(`"${dotEnvPath}"`),
            ccolors.warn("\nthen run"),
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
        throw new Error(
          [
            sealedSecretManifestLabel,
            ccolors.error("Secret string literals are not supported.\nUse"),
            ccolors.key_name(
              `"${CNDI_SECRETS_PREFIX}YOUR_SECRET_ENV_VAR_NAME)"`,
            ),
            ccolors.error("to reference environment variables at"),
            "cndi_config.yaml" +
            ccolors.key_name(
              `.cluster_manifests.${inputSecret.metadata.name}.stringData.${dataEntryKey}`,
            ),
          ].join(" "),
          { cause: 701 },
        );
      }
    }
  } else {
    throw new Error(
      [
        sealedSecretManifestLabel,
        ccolors.error(
          `Secret`,
        ),
        ccolors.key_name(`"${inputSecret.metadata.name}"`),
        ccolors.error("has no data or stringData"),
      ].join(" "),
      {
        cause: 702,
      },
    );
  }
  delete outputSecret.data;
  return outputSecret;
};

// if a user passes in a cndi_config.yaml file in non-interactive mode
// we want to write placeholders for the $.cndi.secrets entries to the .env file
function addSecretPlaceholder(secretEnvName: string, dotEnvPath: string) {
  const placeholder = `__${secretEnvName}${PLACEHOLDER_SUFFIX}`;
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
      dotEnvLines.push(`${secretEnvName}='${placeholder}'`);
    }

    Deno.writeTextFileSync(dotEnvPath, dotEnvLines.join("\n"));
  }
}

type GetSealedSecretManifestOptions = {
  publicKeyFilePath: string;
  envPath: string;
  ks_checks: Record<string, string>;
  secretFileName: string;
};

type SealedSecretManifestWithKSC = {
  manifest: string;
  ksc: Record<string, string>;
};

const getSealedSecretManifestWithKSC = async (
  secret: KubernetesSecret,
  { publicKeyFilePath, envPath, ks_checks, secretFileName }:
    GetSealedSecretManifestOptions,
): Promise<SealedSecretManifestWithKSC | null> => {
  let sealed = "";
  const pathToKubeseal = getPathToKubesealBinary();
  const secretPath = await Deno.makeTempFile();
  const secretWithStringData = await parseCndiSecret(secret, envPath);

  // if the secret is just a placeholder we don't want to seal it
  if (secretWithStringData.isPlaceholder) {
    return null;
  }

  const secretDigest = await sha256Digest(JSON.stringify(secretWithStringData));

  const ksId = secretFileName.replace(".yaml", "");

  if (ks_checks[ksId] === secretDigest) {
    // secret has not changed since last deployment
    return null;
  }

  const secretFileOptions: Deno.WriteFileOptions = {
    create: true,
  };

  if (platform() !== "win32") {
    // cndi.exe crashes if we do this
    secretFileOptions.mode = 0o777;
  }

  await Deno.writeTextFile(
    secretPath,
    getYAMLString(secretWithStringData),
    secretFileOptions,
  );

  const kubesealCommand = new Deno.Command(pathToKubeseal, {
    args: [
      `--cert=${publicKeyFilePath}`,
      `--secret-file=${secretPath}`,
      `--scope=cluster-wide`,
    ],
    stderr: "piped",
    stdout: "piped",
  });

  const kubesealCommandOutput = await kubesealCommand.output();

  if (kubesealCommandOutput.code !== 0) {
    Deno.stdout.write(kubesealCommandOutput.stderr);
    throw new Error("kubeseal command exited with non-zero status code.", {
      cause: kubesealCommandOutput.code,
    });
  } else {
    sealed = new TextDecoder().decode(kubesealCommandOutput.stdout);
  }
  return { manifest: sealed, ksc: { [ksId]: secretDigest } };
};

export default getSealedSecretManifestWithKSC;
