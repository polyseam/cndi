import { getPrettyJSONString } from "src/utils.ts";

export default function getVariablesTFJSON(): string {
  return getPrettyJSONString({
    variable: {
      git_password: [
        {
          description: "password for accessing cluster repository",
          type: "string",
        },
      ],
      git_ssh_private_key: [
        {
          description: "ssh private key for accessing cluster repository",
          type: "string",
        },
      ],
      git_username: [
        {
          description: "username for accessing cluster repository",
          type: "string",
        },
      ],
      git_repo: [
        {
          description: "repository URL to access",
          type: "string",
        },
      ],
      argocd_admin_password: [
        {
          description: "password for accessing the argo ui",
          type: "string",
        },
      ],
      sealed_secrets_private_key: [
        {
          description: "private key for decrypting sealed secrets",
          type: "string",
        },
      ],
      sealed_secrets_public_key: [
        {
          description: "public key for encrypting sealed secrets",
          type: "string",
        },
      ],
    },
  });
}
