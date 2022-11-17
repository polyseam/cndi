import { DotEnvArgs } from "../types.ts";
import { trimPemString } from "../utils.ts";

const getDotEnv = ({
  sealedSecretsKeys,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  GIT_REPO,
  GIT_PASSWORD,
  GIT_USERNAME,
  terraformStatePassphrase,
  argoUIReadonlyPassword,
}: DotEnvArgs): string => {
  // convert keys with padding into key material with "_" instead of line breaks
  const SEALED_SECRETS_PUBLIC_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_public_key,
  ).replaceAll("\n", "_");
  const SEALED_SECRETS_PRIVATE_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_private_key,
  ).replaceAll("\n", "_");

  // because in interactive mode these variables are required immediately
  // we cannot rely on them having been loaded in from the .env file
  const _AWS_REGION = "AWS_REGION";
  const _AWS_ACCESS_KEY_ID = "AWS_ACCESS_KEY_ID";
  const _AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY";

  Deno.env.set(_AWS_REGION, AWS_REGION);
  Deno.env.set(_AWS_ACCESS_KEY_ID, AWS_ACCESS_KEY_ID);
  Deno.env.set(_AWS_SECRET_ACCESS_KEY, AWS_SECRET_ACCESS_KEY);

  const _GIT_USERNAME = "GIT_USERNAME";
  const _GIT_PASSWORD = "GIT_PASSWORD";
  const _GIT_REPO = "GIT_REPO";

  Deno.env.set(_GIT_USERNAME, GIT_USERNAME);
  Deno.env.set(_GIT_PASSWORD, GIT_PASSWORD);
  Deno.env.set(_GIT_REPO, GIT_REPO);

  const _SEALED_SECRETS_PRIVATE_KEY_MATERIAL =
    "SEALED_SECRETS_PRIVATE_KEY_MATERIAL";
  const _SEALED_SECRETS_PUBLIC_KEY_MATERIAL =
    "SEALED_SECRETS_PUBLIC_KEY_MATERIAL";

  Deno.env.set(
    _SEALED_SECRETS_PRIVATE_KEY_MATERIAL,
    SEALED_SECRETS_PRIVATE_KEY_MATERIAL,
  );
  Deno.env.set(
    _SEALED_SECRETS_PUBLIC_KEY_MATERIAL,
    SEALED_SECRETS_PUBLIC_KEY_MATERIAL,
  );

  const _TERRAFORM_STATE_PASSPHRASE = "TERRAFORM_STATE_PASSPHRASE";

  Deno.env.set(_TERRAFORM_STATE_PASSPHRASE, terraformStatePassphrase);

  const _ARGO_UI_READONLY_PASSWORD = "ARGO_UI_READONLY_PASSWORD";

  Deno.env.set(_ARGO_UI_READONLY_PASSWORD, argoUIReadonlyPassword);

  // after all variables are set in the current environment
  // write them to the .env file
  return `# AWS Credentials
${_AWS_REGION}=${AWS_REGION}
${_AWS_ACCESS_KEY_ID}=${AWS_ACCESS_KEY_ID}
${_AWS_SECRET_ACCESS_KEY}=${AWS_SECRET_ACCESS_KEY}

# Git Credentials
${_GIT_USERNAME}=${GIT_USERNAME}
${_GIT_PASSWORD}=${GIT_PASSWORD}
${_GIT_REPO}=${GIT_REPO}

# Kubeseal Keypair
${_SEALED_SECRETS_PRIVATE_KEY_MATERIAL}=${SEALED_SECRETS_PRIVATE_KEY_MATERIAL}
${_SEALED_SECRETS_PUBLIC_KEY_MATERIAL}=${SEALED_SECRETS_PUBLIC_KEY_MATERIAL}

# Terraform State Passphrase
${_TERRAFORM_STATE_PASSPHRASE}=${terraformStatePassphrase}

# ArgoCD UI Readonly Password
${_ARGO_UI_READONLY_PASSWORD}=${argoUIReadonlyPassword}
`;
};

export default getDotEnv;
