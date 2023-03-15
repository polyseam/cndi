import { path } from "deps";

import { SealedSecretsKeys } from "src/types.ts";
import { getPathToOpenSSLForPlatform } from "src/utils.ts";

const createSealedSecretsKeys = async (
  outputDir: string,
): Promise<SealedSecretsKeys> => {
  const pathToKeys = path.join(outputDir, ".keys");
  const pathToOpenSSL = getPathToOpenSSLForPlatform();
  Deno.mkdir(pathToKeys, { recursive: true });
  const sealed_secrets_public_key_path = path.join(pathToKeys, "public.pem");
  const sealed_secrets_private_key_path = path.join(pathToKeys, "private.pem");

  let sealed_secrets_private_key;
  let sealed_secrets_public_key;

  const ranOpenSSLGenerateKeyPair = Deno.run({
    cmd: [
      pathToOpenSSL,
      "req",
      "-x509",
      "-nodes",
      "-newkey",
      "rsa:4096",
      "-keyout",
      sealed_secrets_private_key_path,
      "-out",
      sealed_secrets_public_key_path,
      "-subj",
      "/CN=sealed-secret/O=sealed-secret",
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const generateKeyPairStatus = await ranOpenSSLGenerateKeyPair.status();
  const generateKeyPairStderr = await ranOpenSSLGenerateKeyPair.stderrOutput();

  if (generateKeyPairStatus.code !== 0) {
    Deno.stdout.write(generateKeyPairStderr);
    Deno.exit(251); // arbitrary exit code
  } else {
    sealed_secrets_private_key = await Deno.readTextFile(
      sealed_secrets_private_key_path,
    );
    sealed_secrets_public_key = await Deno.readTextFile(
      sealed_secrets_public_key_path,
    );
    Deno.removeSync(pathToKeys, { recursive: true });
  }

  ranOpenSSLGenerateKeyPair.close();

  return {
    sealed_secrets_private_key,
    sealed_secrets_public_key,
  };
};

const loadSealedSecretsKeys = (): SealedSecretsKeys | null => {
  const sealed_secrets_public_key = Deno.env.get(
    "SEALED_SECRETS_PUBLIC_KEY",
  ) as string;

  const sealed_secrets_private_key = Deno.env.get(
    "SEALED_SECRETS_PRIVATE_KEY",
  ) as string;

  if (!sealed_secrets_public_key) {
    return null;
  }

  if (!sealed_secrets_private_key) {
    return null;
  }

  const sealedSecrets = {
    sealed_secrets_private_key,
    sealed_secrets_public_key,
  };

  return sealedSecrets;
};

export { createSealedSecretsKeys, loadSealedSecretsKeys };
