import { TerraformRootFileData } from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}",
      controller_node_ip: "",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      git_repo: "${var.git_repo}",
      sealed_secrets_private_key:
        "${var.sealed_secrets_private_key}",
      sealed_secrets_public_key:
        "${var.sealed_secrets_public_key}",
    },
  ],
  provider: {
    random: [{}],
    aws: [{}],
  },
  resource: {
    random_password: {
      generated_token: [
        {
          length: 32,
          special: false,
          upper: false,
        },
      ],
    },
  },
  terraform: [
    {
      required_providers: [
        {
          external: {
            source: "hashicorp/external",
            version: "2.2.2",
          },
        },
      ],
      required_version: ">= 1.2.0",
    },
  ],
  variable: {
    git_password: [
      {
        description: "password for accessing the repositories",
        type: "string",
      },
    ],
    git_username: [
      {
        description: "password for accessing the repositories",
        type: "string",
      },
    ],
    git_repo: [
      {
        description: "repository URL to access",
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
};

export default terraformRootFileData;
