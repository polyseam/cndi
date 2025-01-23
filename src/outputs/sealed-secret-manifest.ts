import { ccolors, platform } from "deps";
import { KubernetesSecret, KubernetesSecretWithStringData } from "src/types.ts";
import {
  getPathToKubesealBinary,
  getYAMLString,
  PxResult,
  sha256Digest,
} from "src/utils.ts";

import { ErrOut } from "errout";

const CNDI_SECRETS_PREFIX = "$cndi_on_ow.seal_secret_from_env_var(";
const PLACEHOLDER_SUFFIX = "_PLACEHOLDER__";

const label = ccolors.faded(
  "\nsrc/outputs/sealed-secret-manifest.ts:",
);

const parseCndiSecret = (
  inputSecret: KubernetesSecret,
  dotEnvPath: string,
): PxResult<KubernetesSecretWithStringData> => {
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
            addSecretPlaceholderToDotenv(secretEnvName, dotEnvPath);
          }
          outputSecret.isPlaceholder = true;
        } else {
          try {
            const decodedSecretEnvVal = atob(secretEnvVal);
            outputSecret.stringData[dataEntryKey] = decodedSecretEnvVal;
            outputSecret.isPlaceholder = false;
          } catch {
            // secret data cannot be decoded, likely plaintext string instead of base64
            return [
              new ErrOut([
                ccolors.error("Secret named"),
                ccolors.key_name(`"${inputSecret.metadata.name}"`),
                ccolors.error("loaded"),
                ccolors.key_name(".data"),
                ccolors.error("from environment variable"),
                ccolors.key_name(`"${secretEnvName}"`),
                ccolors.error(
                  "and it was not base64 encoded.\n\nDid you mean to use",
                ),
                ccolors.key_name(
                  ".stringData",
                ),
                ccolors.error("instead?"),
              ], {
                label,
                id:
                  "sealed-secret-manifest: !isBase64(env.secretLoadedFromEnv)",
                code: 706,
              }),
            ];
          }
        }
      } else {
        // if we find a secret that doesn't use our special token we tell the user that using secrets without it is unsupported
        return [
          new ErrOut(
            [
              ccolors.error("Secret string literals are not supported.\nUse"),
              ccolors.key_name(
                `"${CNDI_SECRETS_PREFIX}YOUR_SECRET_ENV_VAR_NAME)"`,
              ),
              ccolors.error("to reference environment variables at"),
              ccolors.key_name(
                `"${inputSecret.metadata.name}.data.${dataEntryKey}"`,
              ),
            ],
            {
              label,
              id: "sealed-secret-manifest: !isCNDIMacro(inputSecret.data)",
              code: 700,
            },
          ),
        ];
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
            label,
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
            addSecretPlaceholderToDotenv(secretEnvName, dotEnvPath);
          }
          outputSecret.isPlaceholder = true;
        } else {
          outputSecret.stringData[dataEntryKey] = secretEnvVal;
          outputSecret.isPlaceholder = false;
        }
      } else {
        return [
          new ErrOut(
            [
              ccolors.error("Secret string literals are not supported.\nUse"),
              ccolors.key_name(
                `"${CNDI_SECRETS_PREFIX}YOUR_SECRET_ENV_VAR_NAME)"`,
              ),
              ccolors.error("to reference environment variables at"),
              "cndi_config.yaml" +
              ccolors.key_name(
                `.cluster_manifests.${inputSecret.metadata.name}.stringData.${dataEntryKey}`,
              ),
            ],
            {
              code: 701,
              label,
              id:
                "sealed-secret-manifest: !isCNDIMacro(inputSecret.stringData)",
            },
          ),
        ];
      }
    }
  } else {
    return [
      new ErrOut([
        ccolors.error(`Secret`),
        ccolors.key_name(`"${inputSecret.metadata.name}"`),
        ccolors.error("has no data or stringData"),
      ], {
        label,
        id:
          "sealed-secret-manifest: !inputSecret.data && !inputSecret.stringData",
        code: 702,
      }),
    ];
  }
  delete outputSecret.data;
  return [undefined, outputSecret];
};

// if a user passes in a cndi_config.yaml file in non-interactive mode
// we want to write placeholders for the $.cndi.secrets entries to the .env file
async function addSecretPlaceholderToDotenv(
  secretEnvName: string,
  dotEnvPath: string,
) {
  const placeholder = `__${secretEnvName}${PLACEHOLDER_SUFFIX}`;
  const dotEnv = await Deno.readTextFile(dotEnvPath);
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

    await Deno.writeTextFile(dotEnvPath, dotEnvLines.join("\n"));
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
): Promise<PxResult<SealedSecretManifestWithKSC | null>> => {
  let sealed = "";
  const pathToKubeseal = getPathToKubesealBinary();
  let secretPath: string;
  try {
    secretPath = await Deno.makeTempFile();
  } catch (err) {
    return [
      new ErrOut([
        "Failed to create temporary file while encrypting your secret",
      ], {
        label,
        code: 704,
        id: "sealed-secret-manifest: !Deno.makeTempFile",
        cause: err as Error,
      }),
    ];
  }

  const [err, secretWithStringData] = parseCndiSecret(secret, envPath);

  if (err) return [err];

  // if the secret is just a placeholder we don't want to seal it
  if (secretWithStringData.isPlaceholder) {
    return [undefined, null];
  }

  const secretDigest = await sha256Digest(JSON.stringify(secretWithStringData));

  const ksId = secretFileName.replace(".yaml", "");

  if (ks_checks[ksId] === secretDigest) {
    // secret has not changed since last deployment
    return [undefined, null];
  }

  const secretFileOptions: Deno.WriteFileOptions = {
    create: true,
  };

  if (platform() !== "win32") {
    // cndi.exe crashes if we do this
    secretFileOptions.mode = 0o777;
  }

  try {
    await Deno.writeTextFile(
      secretPath,
      getYAMLString(secretWithStringData),
      secretFileOptions,
    );
  } catch (err) {
    return [
      new ErrOut([
        ccolors.error("failed to write Secret manifest to seal with"),
        ccolors.key_name("kubeseal"),
      ], {
        label,
        code: 705,
        id: "sealed-secret-manifest: !Deno.writeTextFile(UnsealedSecret)",
        cause: err as Error,
        metadata: { secretPath },
      }),
    ];
  }

  const kubesealCommand = new Deno.Command(pathToKubeseal, {
    args: [
      `--cert=${publicKeyFilePath}`,
      `--secret-file=${secretPath}`,
      `--scope=cluster-wide`,
      `--allow-empty-data`,
      `--format=yaml`,
    ],
    stderr: "piped",
    stdout: "piped",
  });

  const kubesealCommandOutput = await kubesealCommand.output();

  if (kubesealCommandOutput.code !== 0) {
    Deno.stdout.write(kubesealCommandOutput.stderr);
    return [
      new ErrOut([
        ccolors.key_name("kubeseal"),
        ccolors.error("failed to seal secret"),
      ], {
        label,
        code: 703,
        id: "src/outputs/sealed-secret-manifest/kubeseal/exit_code/!0",
      }),
    ];
  } else {
    sealed = new TextDecoder().decode(kubesealCommandOutput.stdout);
  }
  return [undefined, { manifest: sealed, ksc: { [ksId]: secretDigest } }];
};

export default getSealedSecretManifestWithKSC;
