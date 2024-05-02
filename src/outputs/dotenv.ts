import type { SealedSecretsKeys } from "src/types.ts";

export default function getFinalEnvString(
  templatePartial = "",
  cndiGeneratedValues: {
    sshPublicKey: string | null;
    sealedSecretsKeys: SealedSecretsKeys;
    terraformStatePassphrase: string;
    argoUIAdminPassword: string;
    debugMode: boolean;
  },
) {
  const { sealedSecretsKeys, terraformStatePassphrase, argoUIAdminPassword } =
    cndiGeneratedValues;

  let telemetryMode = "";

  if (cndiGeneratedValues.debugMode) {
    telemetryMode = "\n\n# Telemetry Mode\nCNDI_TELEMETRY=debug";
  }

  const sshKeysPartial = cndiGeneratedValues.sshPublicKey
    ? `
# SSH Keys
SSH_PUBLIC_KEY='${cndiGeneratedValues.sshPublicKey}'`
    : "";

  return `
# CNDI Environment Variables

# Sealed Secrets Keys
SEALED_SECRETS_PRIVATE_KEY='${sealedSecretsKeys.sealed_secrets_private_key}'
SEALED_SECRETS_PUBLIC_KEY='${sealedSecretsKeys.sealed_secrets_public_key}'
${sshKeysPartial}

# Terraform State Passphrase
TERRAFORM_STATE_PASSPHRASE=${terraformStatePassphrase}

# Argo UI Admin Password
ARGOCD_ADMIN_PASSWORD=${argoUIAdminPassword}${telemetryMode}
  ${templatePartial}`.trim();
}
