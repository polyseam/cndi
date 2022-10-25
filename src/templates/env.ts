import * as path from "https://deno.land/std@0.157.0/path/mod.ts";

const getDotEnv = (pathToKeys: string): string => {
  const privateKey = Deno.readTextFileSync(path.join(pathToKeys, "key.pem"))
    .replace("-----BEGIN PRIVATE KEY-----\n", "").replace(
      "\n-----END PRIVATE KEY-----\n",
      "",
    );
  const publicKey = Deno.readTextFileSync(path.join(pathToKeys, "cert.pem"))
    .replace("-----BEGIN CERTIFICATE-----\n", "").replace(
      "\n-----END CERTIFICATE-----\n",
      "",
    );
  const terraformPassphrase = crypto.randomUUID();

  return `# AWS Credentials
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Git Credentials
GIT_USERNAME=
GIT_PASSWORD=
GIT_REPO=

# Kubeseal Keypair
SEALED_SECRETS_PRIVATE_KEY="${privateKey}"

SEALED_SECRETS_PUBLIC_KEY="${publicKey}"

# Terraform State Passphrase
TERRAFORM_STATE_PASSPHRASE=${terraformPassphrase}
`;
};

export default getDotEnv;
