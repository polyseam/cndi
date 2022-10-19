import { TerraformRootFileData } from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      bootstrap_token: "${random_string.generated_token.result}",
      controller_node_ip: "${aws_instance.controller.private_ip}",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      repo_url: "${var.repo_url}",
    },
  ],
  provider: {
    random: [{}],
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
    repo_url: [
      {
        description: "repository to access",
        type: "string",
      },
    ],
  },
};

export default terraformRootFileData;
