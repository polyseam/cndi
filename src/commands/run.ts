import { ccolors, Command, path } from "../deps.ts";

import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";

import setTF_VARs from "../setTF_VARs.ts";
import { getPathToTerraformBinary } from "../utils.ts";

const runLabel = ccolors.faded("\nsrc/commands/run.ts:");

/**
 * COMMAND cndi run
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const runCommand = new Command()
  .description(`Deploy cndi cluster with project files.`)
  .option("-p, --path <path:string>", "path to your cndi git repository", {
    default: Deno.cwd(),
  })
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
    "ARGOCD_ADMIN_PASSWORD=<value:string>",
    "Password used to authenticate to the ArgoCD UI.",
    { required: true },
  )
  .env(
    "GIT_USERNAME=<value:string>",
    "Username ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .env(
    "GIT_TOKEN=<value:string>",
    "Personal access token ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .env(
    "GIT_SSH_PRIVATE_KEY=<value:string>",
    "SSH Private Key ArgoCD will use to authenticate to your git repository.",
    { required: false },
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

      console.log(ccolors.faded("\n-- terraform init --\n"));

      const terraformInitCommand = new Deno.Command(pathToTerraformBinary, {
        args: [`-chdir=${pathToTerraformResources}`, "init"],
        stderr: "piped",
        stdout: "piped",
      });

      const terraformInitCommandOutput = await terraformInitCommand.output();

      await Deno.stdout.write(terraformInitCommandOutput.stdout);
      await Deno.stderr.write(terraformInitCommandOutput.stderr);

      if (terraformInitCommandOutput.code !== 0) {
        console.log(runLabel, ccolors.error("terraform init failed"));
        Deno.exit(terraformInitCommandOutput.code);
      }

      console.log(ccolors.faded("\n-- terraform apply --\n"));

      const terraformApplyCommand = new Deno.Command(pathToTerraformBinary, {
        args: [
          `-chdir=${pathToTerraformResources}`,
          "apply",
          "-auto-approve",
        ],
        stderr: "piped",
        stdout: "piped",
      });

      const terraformApplyChildProcess = terraformApplyCommand.spawn();

      for await (const chunk of terraformApplyChildProcess.stdout) {
        Deno.stdout.write(chunk);
      }

      for await (const chunk of terraformApplyChildProcess.stderr) {
        Deno.stderr.write(chunk);
      }

      const status = await terraformApplyChildProcess.status;

      await pushStateFromRun({ pathToTerraformResources, cmd });

      // if `terraform apply` fails, exit with the code
      if (status.code !== 0) {
        Deno.exit(status.code);
      }
    } catch (err) {
      console.log(
        runLabel,
        ccolors.error("cndi failed to deploy your resources"),
      );
      console.log(ccolors.caught(err));
    }
  });

export default runCommand;
