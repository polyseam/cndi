import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { SealedSecretsKeys } from "../types.ts";
import { trimPemString } from "../utils.ts";

const getDotEnv = (
  sealedSecretsKeys: SealedSecretsKeys,
  terraformStatePassphrase: string,
): string => {
  const SEALED_SECRETS_PUBLIC_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_public_key,
  );
  const SEALED_SECRETS_PRIVATE_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_private_key,
  );

  return `# AWS Credentials
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Git Credentials
GIT_USERNAME=
GIT_PASSWORD=
GIT_REPO=

# Kubeseal Keypair
SEALED_SECRETS_PRIVATE_KEY_MATERIAL="
${SEALED_SECRETS_PRIVATE_KEY_MATERIAL}"

SEALED_SECRETS_PUBLIC_KEY_MATERIAL="
${SEALED_SECRETS_PUBLIC_KEY_MATERIAL}"

# Terraform State Passphrase
TERRAFORM_STATE_PASSPHRASE=${terraformStatePassphrase}
`;
};

export default getDotEnv;
