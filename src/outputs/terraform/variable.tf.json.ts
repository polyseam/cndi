import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

type Variables = Record<string, {
  description: string;
  type: string;
  sensitive?: boolean;
}>;

const _label = ccolors.faded("\nsrc/outputs/terraform/variable.tf.json.ts:");

const VARIABLE: Variables = {
  ARGOCD_ADMIN_PASSWORD: {
    type: "string",
    description: "ArgoCD admin password",
    sensitive: true,
  },
  GIT_REPO: {
    type: "string",
    description: "Cluster git repository URL",
  },
  GIT_SSH_PRIVATE_KEY: {
    type: "string",
    description: "SSH private key for Git repository access",
    sensitive: true,
  },
  GIT_TOKEN: {
    type: "string",
    description: "Git token for repository access",
    sensitive: true,
  },
  GIT_USERNAME: {
    type: "string",
    description: "Git username for repository access",
  },
  SEALED_SECRETS_PUBLIC_KEY: {
    type: "string",
    description:
      "Sealed Secrets public key for encrypting secrets in the cluster",
  },
  SEALED_SECRETS_PRIVATE_KEY: {
    type: "string",
    description:
      "Sealed Secrets private key for decrypting secrets in the cluster",
    sensitive: true,
  },
  SSH_PUBLIC_KEY: {
    description: "public key for accessing cluster nodes",
    type: "string",
  },
} as const;

export default function getVariableTfJSON(
  _cndi_config: CNDIConfig,
): string {
  // TODO: some variables are not used in every stack
  return getPrettyJSONString({ variable: VARIABLE });
}
