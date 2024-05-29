import type { SealedSecretsKeys } from "src/types.ts";

type GetFinalEnvOptions = {
  sshPublicKey: string | null;
  sealedSecretsKeys: SealedSecretsKeys | null;
  debugMode: boolean;
};

const HEADING_COMMENT = "# CNDI Environment Variables";

export default function getFinalEnvString(
  templatePartial = "",
  envOptions: GetFinalEnvOptions,
) {
  const lines = [HEADING_COMMENT, ""];

  const { sealedSecretsKeys, debugMode, sshPublicKey } = envOptions;

  if (debugMode) {
    lines.push("# Telemetry Mode", "CNDI_TELEMETRY='debug'");
  }

  if (sshPublicKey) {
    lines.push("# SSH Keys", `SSH_PUBLIC_KEY='${sshPublicKey}'`);
  }

  if (sealedSecretsKeys) {
    lines.push("# Sealed Secrets Keys");
    lines.push(
      `SEALED_SECRETS_PRIVATE_KEY='${sealedSecretsKeys.sealed_secrets_private_key}'`,
    );
    lines.push(
      `SEALED_SECRETS_PUBLIC_KEY='${sealedSecretsKeys.sealed_secrets_public_key}'`,
    );
  }

  if (templatePartial) {
    lines.push(templatePartial);
  }

  return lines.join("\n");
}
