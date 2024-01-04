import { silky } from "deps";

import { SealedSecretsKeys } from "src/types.ts";

const createSealedSecretsKeys = async (): Promise<SealedSecretsKeys> => {
  const { publicKey, privateKey } = await silky.generateSelfSignedX509KeyPair(
    "CN=sealed-secret, O=sealed-secret",
  );

  const sealed_secrets_private_key = privateKey;
  const sealed_secrets_public_key = publicKey;

  Deno.env.set("SEALED_SECRETS_PRIVATE_KEY", sealed_secrets_private_key);
  Deno.env.set("SEALED_SECRETS_PUBLIC_KEY", sealed_secrets_public_key);

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
