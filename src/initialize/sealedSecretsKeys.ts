import { padPrivatePem, padPublicPem } from "../utils.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";

import { CNDIContext, SealedSecretsKeys } from "../types.ts";

const createSealedSecretsKeys = async ({
  pathToKeys,
  pathToOpenSSL,
}: CNDIContext): Promise<SealedSecretsKeys> => {
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
  const sealed_secrets_public_key_material = Deno.env
    .get("SEALED_SECRETS_PUBLIC_KEY_MATERIAL")
    ?.trim()
    .replaceAll("_", "\n");
  const sealed_secrets_private_key_material = Deno.env
    .get("SEALED_SECRETS_PRIVATE_KEY_MATERIAL")
    ?.trim()
    .replaceAll("_", "\n");

  if (!sealed_secrets_public_key_material) {
    return null;
  }

  if (!sealed_secrets_private_key_material) {
    return null;
  }

  const sealedSecrets = {
    sealed_secrets_private_key: padPrivatePem(
      sealed_secrets_private_key_material,
    ),
    sealed_secrets_public_key: padPublicPem(sealed_secrets_public_key_material),
  };

  return sealedSecrets;
};

export { createSealedSecretsKeys, loadSealedSecretsKeys };
