import { TerraformRootFileData } from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}",
      controller_node_ip: "",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      git_repo: "${var.git_repo}",
      sealed_secrets_private_key_material:"${var.sealed_secrets_private_key_material}",
      sealed_secrets_public_key_material:"${var.sealed_secrets_public_key_material}"
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
    sealed_secrets_private_key_material: [
      {
        description: "private key material for decrypting sealed secrets",
        type: "string",
      },
    ],
    sealed_secrets_public_key_material: [
      {
        description: "public key material for encrypting sealed secrets",
        type: "string",
      },
    ],
  },
};

export default terraformRootFileData;
