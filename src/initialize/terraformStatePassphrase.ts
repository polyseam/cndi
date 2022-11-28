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
  return getSecretOfLength(32);
};

export { createTerraformStatePassphrase, loadTerraformStatePassphrase };
