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
  return crypto.randomUUID().replaceAll("-", "");
};

export { createTerraformStatePassphrase, loadTerraformStatePassphrase };
