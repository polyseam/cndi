import type { SealedSecretsKeys } from "src/types.ts";

type GetFinalEnvOptions = {
  sshPublicKey: string | null;
  sealedSecretsKeys: SealedSecretsKeys | null;
  debugMode: boolean;
};

const HEADING_COMMENT = "# CNDI Environment Variables\n";
export default function getFinalEnvString(
  templatePartial = "",
  envOptions: GetFinalEnvOptions,
) {
  const { sealedSecretsKeys, debugMode, sshPublicKey } = envOptions;

  let debugFragment = "";
  let sshFragment = "";
  let sealedSecretsKeysFragment = "";

  if (debugMode) {
    debugFragment = "\n\n# Telemetry Mode\nCNDI_TELEMETRY=debug";
  }

  if (sshPublicKey) {
    sshFragment = "\n\n# SSH Keys\nSSH_PUBLIC_KEY='${sshPublicKey}'";
  }

  if (sealedSecretsKeys) {
    sealedSecretsKeysFragment = `\n\n# Sealed Secrets Keys
SEALED_SECRETS_PRIVATE_KEY='${sealedSecretsKeys.sealed_secrets_private_key}'
SEALED_SECRETS_PUBLIC_KEY='${sealedSecretsKeys.sealed_secrets_public_key}'`;
  }

  return `${HEADING_COMMENT}
  ${debugFragment}
  ${sshFragment}
  ${sealedSecretsKeysFragment}

  ${templatePartial}
  `.trim() + "\n\n";
}
