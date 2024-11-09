import { ccolors, Command, path } from "deps";

import { pullStateForTerraform } from "src/tfstate/git/read-state.ts";

import setTF_VARs from "src/setTF_VARs.ts";

import { emitExitEvent, getPathToTerraformBinary } from "src/utils.ts";

import { PROCESS_ERROR_CODE_PREFIX } from "consts";

const showoutputsLabel = ccolors.faded("\nsrc/commands/showoutputs.ts:");

/**
 * COMMAND cndi show-outputs
 * Shows terraform outputs pushing state
 */
const showOutputsCommand = new Command()
  .description(`Show terraform outputs from the most recent run.`)
  .option("-p, --path <path:string>", "path to your cndi git repository", {
    default: Deno.cwd(),
  })
  .option("--json", "Output as JSON.")
  .option("-q, --quiet", "Eliminate unnecessary output.")
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
    "ARGOCD_ADMIN_PASSWORD=<value:string>",
    "Password used to authenticate to the ArgoCD UI.",
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
    const cmd = "cndi show-outputs";
    if (!options?.quiet) {
      console.log(`${cmd}\n`);
    }
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
      if (!options?.quiet) {
        console.log(ccolors.faded("\n-- terraform init --\n"));
      }
      const terraformInitCommand = new Deno.Command(pathToTerraformBinary, {
        args: [`-chdir=${pathToTerraformResources}`, "init"],
        stderr: "piped",
        stdout: "piped",
      });

      const terraformInitCommandOutput = await terraformInitCommand.output();

      if (!options?.quiet) {
        await Deno.stdout.write(terraformInitCommandOutput.stdout);
      }
      await Deno.stderr.write(terraformInitCommandOutput.stderr);

      if (terraformInitCommandOutput.code !== 0) {
        console.log(showoutputsLabel, ccolors.error("terraform init failed"));
        const cndiExitCode = parseInt(
          `${PROCESS_ERROR_CODE_PREFIX.terraform}${terraformInitCommandOutput.code}`,
        );
        await emitExitEvent(cndiExitCode);
        Deno.exit(terraformInitCommandOutput.code);
      }
    } catch (err) {
      console.log(
        showoutputsLabel,
        ccolors.error("failed to spawn 'terraform init'"),
      );
      console.log(ccolors.caught(err as Error));
      await emitExitEvent(1700);
      Deno.exit(1700);
    }

    try {
      if (!options?.quiet) {
        console.log(ccolors.faded("\n-- terraform output --\n"));
      }
      const outputArgs = [
        `-chdir=${pathToTerraformResources}`,
        "output",
      ];

      if (options.json) {
        outputArgs.push("-json");
      }

      const terraformOutputCommand = new Deno.Command(pathToTerraformBinary, {
        args: outputArgs,
        stderr: "piped",
        stdout: "piped",
      });

      const terraformOutputChildProcess = terraformOutputCommand.spawn();

      for await (const chunk of terraformOutputChildProcess.stdout) {
        Deno.stdout.write(chunk);
      }

      for await (const chunk of terraformOutputChildProcess.stderr) {
        Deno.stderr.write(chunk);
      }

      const status = await terraformOutputChildProcess.status;

      // if `terraform output` fails, exit with the code
      if (status.code !== 0) {
        const cndiExitCode = parseInt(
          `${PROCESS_ERROR_CODE_PREFIX.terraform}${status.code}`,
        );
        await emitExitEvent(cndiExitCode);
        Deno.exit(status.code);
      }
    } catch (err) {
      console.log(
        showoutputsLabel,
        ccolors.error("failed to spawn 'terraform output'"),
      );
      console.log(ccolors.caught(err as Error));
      await emitExitEvent(1701);
      Deno.exit(1701);
    }
    await emitExitEvent(0);
  });

export default showOutputsCommand;
