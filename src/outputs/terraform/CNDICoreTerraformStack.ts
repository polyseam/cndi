import {
  Construct,
  CDKTFProviderRandom,
  TerraformLocal,
  TerraformStack,
  TerraformVariable,
} from "deps";

import { useSshRepoAuth } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";

export class CNDITerraformStack extends TerraformStack {
  variables: Record<string, TerraformVariable> = {};
  locals: Record<string, TerraformLocal> = {};
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name);
    const cndi_project_name = cndi_config.project_name!;

    new CDKTFProviderRandom.provider.RandomProvider(this, "cndi_provider_random", {});

    this.locals.cndi_project_name = new TerraformLocal(
      this,
      "cndi_project_name",
      cndi_project_name,
    );

    this.variables.git_repo = new TerraformVariable(this, "git_repo", {
      type: "string",
      description: "repository URL to access",
    });

    this.variables.argocd_admin_password = new TerraformVariable(
      this,
      "argocd_admin_password",
      {
        type: "string",
        description: "password for accessing the argo ui",
      },
    );

    this.variables.sealed_secrets_private_key = new TerraformVariable(
      this,
      "sealed_secrets_private_key",
      {
        type: "string",
        description: "private key for decrypting sealed secrets",
      },
    );

    this.variables.sealed_secrets_public_key = new TerraformVariable(
      this,
      "sealed_secrets_public_key",
      {
        type: "string",
        description: "public key for encrypting sealed secrets",
      },
    );

    if (useSshRepoAuth()) {
      this.variables.git_ssh_private_key = new TerraformVariable(
        this,
        "git_ssh_private_key",
        {
          type: "string",
          description: "private key for accessing cluster repository",
        },
      );
    } else {
      this.variables.git_token = new TerraformVariable(this, "git_token", {
        type: "string",
        description: "password for accessing cluster repository",
      });
      this.variables.git_username = new TerraformVariable(
        this,
        "git_username",
        {
          type: "string",
          description: "username for accessing cluster repository",
        },
      );
    }

    const joinToken = new CDKTFProviderRandom.password.Password(this, "cndi_join_token", {
      length: 32,
      special: false,
      upper: false,
    });

    this.locals.bootstrap_token = new TerraformLocal(
      this,
      "bootstrap_token",
      joinToken.result,
    );
  }
}
