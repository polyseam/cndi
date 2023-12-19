import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";
import setTF_VARs from "../setTF_VARs.ts";
import { getPathToTerraformBinary } from "../utils.ts";

import { ccolors, Command, path } from "../deps.ts";

const destroyLabel = ccolors.faded("\nsrc/commands/destroy.ts:");

/**
 * COMMAND cndi destroy
 * Destroys the CNDI cluster represented in the target directory
 */
const destroyCommand = new Command()
  .description(
    `Destroy cluster infrastructure corresponding to project files.`,
  )
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
  ).env(
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
  .option(
    "-y, --auto-approve",
    "Skip interactive approval of plan before applying.",
  )
  .action(async (options) => {
    const cmd = "cndi destroy";
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
        args: [
          `-chdir=${pathToTerraformResources}`,
          "init",
        ],
        stderr: "piped",
        stdout: "piped",
      });

      const terraformInitCommandOutput = await terraformInitCommand.output();

      await Deno.stdout.write(terraformInitCommandOutput.stdout);
      await Deno.stderr.write(terraformInitCommandOutput.stderr);

      if (terraformInitCommandOutput.code !== 0) {
        console.log(destroyLabel, ccolors.error("terraform init failed"));
        Deno.exit(terraformInitCommandOutput.code);
      }

      console.log(ccolors.faded("\n-- terraform destroy --\n"));

      const destroyArgs = [
        `-chdir=${pathToTerraformResources}`,
        "destroy",
      ];

      if (options.autoApprove) {
        destroyArgs.push("-auto-approve");
      }

      const terraformDestroyCommand = new Deno.Command(pathToTerraformBinary, {
        args: destroyArgs,
        stdin: "inherit",
        stderr: "piped",
        stdout: "piped",
      });

      const terraformDestroyChildProcess = terraformDestroyCommand
        .spawn();

      for await (const chunk of terraformDestroyChildProcess.stdout) {
        Deno.stdout.write(chunk);
      }

      for await (const chunk of terraformDestroyChildProcess.stderr) {
        Deno.stderr.write(chunk);
      }

      const status = await terraformDestroyChildProcess.status;

      await pushStateFromRun({ pathToTerraformResources, cmd });

      // if `terraform destroy` fails, exit with the code
      if (status.code !== 0) {
        Deno.exit(status.code);
      }
    } catch (cndiDestroyError) {
      console.error(
        destroyLabel,
        ccolors.error("failed to destroy your cndi terraform resources"),
      );
      console.log(ccolors.caught(cndiDestroyError));
    }
  });

export default destroyCommand;
