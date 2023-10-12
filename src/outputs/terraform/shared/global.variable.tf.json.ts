import { getPrettyJSONString, useSshRepoAuth } from "src/utils.ts";

type TFVariable = {
  description: string;
  type: string;
};

export default function getVariablesTFJSON(): string {
  const variable: Record<string, TFVariable> = {
    git_repo: {
      description: "repository URL to access",
      type: "string",
    },
    argocd_admin_password: {
      description: "password for accessing the argo ui",
      type: "string",
    },
    sealed_secrets_private_key: {
      description: "private key for decrypting sealed secrets",
      type: "string",
    },

    sealed_secrets_public_key: {
      description: "public key for encrypting sealed secrets",
      type: "string",
    },
    ssh_access_public_key: {
      description: "public key for accessing cluster nodes",
      type: "string",
    },
  };

  if (useSshRepoAuth()) {
    variable.git_ssh_private_key = {
      description: "private key for accessing cluster repository",
      type: "string",
    };
  } else {
    variable.git_password = {
      description: "password for accessing cluster repository",
      type: "string",
    };
    variable.git_username = {
      description: "username for accessing cluster repository",
      type: "string",
    };
  }

  return getPrettyJSONString({
    variable,
  });
}
