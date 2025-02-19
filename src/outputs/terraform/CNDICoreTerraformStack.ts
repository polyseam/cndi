import {
  CDKTFProviderRandom,
  Construct,
  TerraformLocal,
  TerraformStack,
  TerraformVariable,
} from "cdktf-deps";

import { useSshRepoAuth } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";
import { PROJECT_NAME_MAX_LENGTH } from "consts";

export class CNDITerraformStack extends TerraformStack {
  variables: Record<string, TerraformVariable> = {};
  locals: Record<string, TerraformLocal> = {};
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name);

    new CDKTFProviderRandom.provider.RandomProvider(
      this,
      "cndi_random_provider",
      {},
    );

    const cndi_project_name = cndi_config.project_name!;

    if (
      cndi_config && cndi_config.project_name &&
      cndi_config.project_name.length > PROJECT_NAME_MAX_LENGTH
    ) {
      // should be unreachable, validated upstream
      this.locals.cndi_project_name = new TerraformLocal(
        this,
        "cndi_project_name",
        cndi_project_name.substring(0, 48),
      );
      console.log();
      console.log(
        ccolors.key_name("cndi_config.yaml[project_name]"),
        ccolors.warn("value"),
        ccolors.user_input(`"${cndi_project_name}"`),
        ccolors.warn(
          `is too long.`,
        ),
        ccolors.warn(`truncating to ${PROJECT_NAME_MAX_LENGTH} characters.`),
      );
      console.log();
    } else {
      this.locals.cndi_project_name = new TerraformLocal(
        this,
        "cndi_project_name",
        cndi_project_name,
      );
    }

    this.variables.git_repo = new TerraformVariable(this, "GIT_REPO", {
      type: "string",
      description: "repository URL to access",
    });

    this.variables.argocd_admin_password = new TerraformVariable(
      this,
      "ARGOCD_ADMIN_PASSWORD",
      {
        type: "string",
        description: "password for accessing the argo ui",
      },
    );

    this.variables.sealed_secrets_private_key = new TerraformVariable(
      this,
      "SEALED_SECRETS_PRIVATE_KEY",
      {
        type: "string",
        description: "private key for decrypting sealed secrets",
      },
    );

    this.variables.sealed_secrets_public_key = new TerraformVariable(
      this,
      "SEALED_SECRETS_PUBLIC_KEY",
      {
        type: "string",
        description: "public key for encrypting sealed secrets",
      },
    );

    this.variables.ssh_public_key = new TerraformVariable(
      this,
      "SSH_PUBLIC_KEY",
      {
        type: "string",
        description: "public key for accessing cluster nodes",
      },
    );

    if (useSshRepoAuth()) {
      this.variables.git_ssh_private_key = new TerraformVariable(
        this,
        "GIT_SSH_PRIVATE_KEY",
        {
          type: "string",
          description: "private key for accessing cluster repository",
        },
      );
    } else {
      this.variables.git_token = new TerraformVariable(this, "GIT_TOKEN", {
        type: "string",
        description: "password for accessing cluster repository",
      });
      this.variables.git_username = new TerraformVariable(
        this,
        "GIT_USERNAME",
        {
          type: "string",
          description: "username for accessing cluster repository",
        },
      );
    }

    const joinToken = new CDKTFProviderRandom.password.Password(
      this,
      "cndi_join_token",
      {
        length: 32,
        special: false,
        upper: false,
      },
    );

    this.locals.bootstrap_token = new TerraformLocal(
      this,
      "bootstrap_token",
      joinToken.result,
    );
  }
}
