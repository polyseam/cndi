import { getSecretOfLength } from "../utils.ts";

const loadTerraformStatePassphrase = (): string | null => {
  const terraform_state_passphrase = Deno.env
    .get("TERRAFORM_STATE_PASSPHRASE")
    ?.trim();

  if (!terraform_state_passphrase) {
    return null;
  }

  return terraform_state_passphrase;
};

const createTerraformStatePassphrase = (): string => {
  const secret = getSecretOfLength(32);
  Deno.env.set("TERRAFORM_STATE_PASSPHRASE", secret);
  return secret;
};

export { createTerraformStatePassphrase, loadTerraformStatePassphrase };
