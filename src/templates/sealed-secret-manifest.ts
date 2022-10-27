import {
  CNDIContext,
  KubernetesSecret,
  KubernetesSecretWithStringData,
} from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";

const CNDI_SECRETS_PREFIX = "$.cndi.secrets.";

const parseCndiSecret = (
  inputSecret: KubernetesSecret,
): KubernetesSecretWithStringData => {
  // convert secret.data to secret.stringData
  const outputSecret = {
    stringData: {},
    ...inputSecret,
  };

  if (inputSecret.data) {
    Object.entries(inputSecret.data).forEach((dataEntry) => {
      const [dataEntryKey, dataEntryValue] = dataEntry;
      if (dataEntryValue.indexOf(CNDI_SECRETS_PREFIX) === 0) {
        const secretEnvName = dataEntryValue.replace(CNDI_SECRETS_PREFIX, "");
        const secretEnvVal = Deno.env.get(secretEnvName);
        if (!secretEnvVal) {
          throw new Error(
            `Environment variable for secret "${inputSecret.metadata.name}" is missing: "${secretEnvName}"`,
          );
        }
        const decodedSecretEnvVal = atob(secretEnvVal);
        outputSecret.stringData[dataEntryKey] = decodedSecretEnvVal;
      } else {
        throw new Error(
          'Secret string literals are not supported. Use "$.cndi.secrets." prefix to reference environment variables.',
        );
      }
    });
  } else if (inputSecret.stringData) {
    Object.entries(inputSecret.stringData).forEach((dataEntry) => {
      const [dataEntryKey, dataEntryValue] = dataEntry;
      if (dataEntryValue.indexOf(CNDI_SECRETS_PREFIX) === 0) {
        const secretEnvName = dataEntryValue.replace(CNDI_SECRETS_PREFIX, "");
        const secretEnvVal = Deno.env.get(secretEnvName);
        if (!secretEnvVal) {
          throw new Error(
            `Environment variable for secret "${inputSecret.metadata.name}" is missing: "${secretEnvName}"`,
          );
        }
        outputSecret.stringData[dataEntryKey] = secretEnvVal;
      } else {
        throw new Error(
          'Secret string literals are not supported. Use "$.cndi.secrets." prefix to reference environment variables.',
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
  { pathToKubeseal }: CNDIContext,
): Promise<string> => {
  let sealed = "";
  const secretPath = await Deno.makeTempFile();

  const secretWithStringData = parseCndiSecret(secret);

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
