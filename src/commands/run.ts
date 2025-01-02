import { ccolors, Command, path } from "deps";

import { pullStateForTerraform } from "src/tfstate/git/read-state.ts";
import { pushStateFromTerraform } from "src/tfstate/git/write-state.ts";

import setTF_VARs from "src/setTF_VARs.ts";
import { emitExitEvent, getPathToTerraformBinary } from "src/utils.ts";

import { PROCESS_ERROR_CODE_PREFIX } from "consts";

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
    { required: false },
  )
  .env(
    "SEALED_SECRETS_PUBLIC_KEY=<value:string>",
    "Public key used to encrypt your sealed secrets.",
    { required: false },
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

    const setTF_VARsError = await setTF_VARs(options.path);

    if (setTF_VARsError) {
      await setTF_VARsError.out();
    }

    const pullStateError = await pullStateForTerraform({
      pathToTerraformResources,
      cmd,
    });

    if (pullStateError) {
      await pullStateError.out();
      return;
    }

    try {
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
        console.error(runLabel, ccolors.error("terraform init failed"));
        const cndiExitCode = parseInt(
          `${PROCESS_ERROR_CODE_PREFIX.terraform}${terraformInitCommandOutput.code}`,
        );
        await emitExitEvent(cndiExitCode);
        Deno.exit(terraformInitCommandOutput.code);
      }
    } catch (err) {
      console.error(
        runLabel,
        ccolors.error("failed to spawn 'terraform init'"),
      );
      console.error(ccolors.caught(err as Error));
      await emitExitEvent(1402);
      Deno.exit(1402);
    }

    try {
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

      const pushStateError = await pushStateFromTerraform({
        pathToTerraformResources,
        cmd,
      });

      if (pushStateError) {
        await pushStateError.out();
        return;
      }

      // if `terraform apply` fails, exit with the code
      if (status.code !== 0) {
        const cndiExitCode = parseInt(
          `${PROCESS_ERROR_CODE_PREFIX.terraform}${status.code}`,
        );
        await emitExitEvent(cndiExitCode);
        Deno.exit(status.code);
      }
    } catch (err) {
      console.error(
        runLabel,
        ccolors.error("failed to spawn 'terraform apply'"),
      );
      console.error(ccolors.caught(err as Error));
      await emitExitEvent(1403);
      Deno.exit(1403);
    }
    await emitExitEvent(0);
  });

export default runCommand;
