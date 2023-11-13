import {
  Construct,
  RandomPassword,
  RandomProvider,
  TerraformLocal,
  TerraformStack,
  TerraformVariable,
} from "deps";

import { useSshRepoAuth } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";

export class CNDITerraformStack extends TerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name);

    const cndi_project_name = cndi_config.project_name!;
    new TerraformLocal(this, "cndi_project_name", {
      cndi_project_name,
    });

    new TerraformVariable(this, "git_repo", {
      type: "string",
      description: "repository URL to access",
    });
    new TerraformVariable(this, "argocd_admin_password", {
      type: "string",
      description: "password for accessing the argo ui",
    });
    new TerraformVariable(this, "sealed_secrets_private_key", {
      type: "string",
      description: "private key for decrypting sealed secrets",
    });

    new TerraformVariable(this, "sealed_secrets_public_key", {
      type: "string",
      description: "public key for encrypting sealed secrets",
    });

    if (useSshRepoAuth()) {
      new TerraformVariable(this, "git_ssh_private_key", {
        type: "string",
        description: "private key for accessing cluster repository",
      });
    } else {
      new TerraformVariable(this, "git_token", {
        type: "string",
        description: "password for accessing cluster repository",
      });
      new TerraformVariable(this, "git_username", {
        type: "string",
        description: "username for accessing cluster repository",
      });
    }

    new RandomProvider(this, "random", {});
    new RandomPassword(this, "cndi_join_token", {
      length: 32,
      special: false,
      upper: false,
    });
  }
}
