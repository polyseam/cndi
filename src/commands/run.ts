import "https://deno.land/std@0.173.0/dotenv/load.ts";
import { copy } from "https://deno.land/std@0.173.0/streams/copy.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";

import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";

import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

import setTF_VARs from "../setTF_VARs.ts";
import { getPathToTerraformBinary } from "../utils.ts";

const runLabel = colors.white("\nrun:");

/**
 * COMMAND cndi run
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const runCommand = new Command()
  .description(
    `Deploy cndi cluster with project files.`,
  )
  .option("-p, --path <path:string>", "path to your cndi git repository", {
    default: Deno.cwd(),
  })
  .env(
    "GIT_USERNAME=<value:string>",
    "Username ArgoCD will use to authenticate to your git repository.",
    { required: true },
  )
  .env(
    "GIT_PASSWORD=<value:string>",
    "Personal access token ArgoCD will use to authenticate to your git repository.",
    { required: true },
  )
  .env(
    "GIT_REPO=<value:string>",
    "URL of your git repository where your cndi project is hosted.",
    { required: true },
  )
  .env(
    "TERRAFORM_STATE_PASSPHRASE=<value:string>",
    "Passphrase used to encrypt your terraform state file.",
    { required: true },
  )
  .env(
    "SEALED_SECRETS_PRIVATE_KEY=<value:string>",
    "Private key used to encrypt your sealed secrets.",
    { required: true },
  )
  .env(
    "SEALED_SECRETS_PUBLIC_KEY=<value:string>",
    "Public key used to encrypt your sealed secrets.",
    { required: true },
  )
  .env(
    "ARGO_UI_ADMIN_PASSWORD=<value:string>",
    "Password used to authenticate to the ArgoCD UI.",
    { required: true },
  )
  .action(async (options) => {
    const cmd = "cndi run";
    console.log(`${cmd}\n`);

    const pathToTerraformResources = path.join(
      options.path,
      "cndi",
      "terraform",
    );

    const pathToTerraformBinary = getPathToTerraformBinary();
    try {
      setTF_VARs(); // set TF_VARs using CNDI's .env variables

      await pullStateForRun({ pathToTerraformResources, cmd });

      // terraform.tfstate will be in this folder after the first run
      const ranTerraformInit = Deno.run({
        cmd: [
          pathToTerraformBinary,
          `-chdir=${pathToTerraformResources}`,
          "init",
        ],
        stderr: "piped",
        stdout: "piped",
      });

      copy(ranTerraformInit.stdout, Deno.stdout);
      copy(ranTerraformInit.stderr, Deno.stderr);

      const initStatus = await ranTerraformInit.status();

      if (initStatus.code !== 0) {
        console.log(runLabel, colors.brightRed("terraform init failed"));
        Deno.exit(initStatus.code);
      }

      ranTerraformInit.close();

      const ranTerraformApply = Deno.run({
        cmd: [
          pathToTerraformBinary,
          `-chdir=${pathToTerraformResources}`,
          "apply",
          "-auto-approve",
        ],
        stderr: "piped",
        stdout: "piped",
      });

      copy(ranTerraformApply.stdout, Deno.stdout);
      copy(ranTerraformApply.stderr, Deno.stderr);

      const applyStatus = await ranTerraformApply.status();

      await pushStateFromRun({ pathToTerraformResources, cmd });

      // if `terraform apply` fails, exit with the code
      if (applyStatus.code !== 0) {
        Deno.exit(applyStatus.code);
      }

      ranTerraformApply.close();
    } catch (err) {
      console.log(runLabel, colors.brightRed("unhandled error"), err);
    }
  });

export default runCommand;
