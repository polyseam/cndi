import pullStateForRun from "src/tfstate/git/read-state.ts";
import pushStateFromRun from "src/tfstate/git/write-state.ts";
import setTF_VARs from "src/setTF_VARs.ts";
import { emitExitEvent, getPathToTerraformBinary } from "src/utils.ts";

import { ccolors, Command, path } from "deps";

import { PROCESS_ERROR_CODE_PREFIX } from "consts";

const destroyLabel = ccolors.faded("\nsrc/commands/destroy.ts:");

type EchoDestroyOptions = {
  yes?: unknown;
  path: string;
};

const echoDestroy = (options: EchoDestroyOptions) => {
  const cndiDestroy = "cndi destroy";
  const cndiDestroyAutoApprove = options.yes
    ? ccolors.user_input(" --yes (-y)")
    : "";
  console.log(
    `${cndiDestroy}${cndiDestroyAutoApprove}\n`,
  );
};

/**
 * COMMAND cndi destroy
 * Destroys the CNDI cluster represented in the target directory
 */
const destroyCommand = new Command()
  .description(
    `Destroy cluster infrastructure corresponding to project files.`,
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
  .option("-p, --path <path:string>", "path to your cndi git repository", {
    default: Deno.cwd(),
  })
  .option(
    "-y, --auto-approve",
    "Skip interactive approval of plan before applying.",
  )
  .action(async (options) => {
    echoDestroy(options);

    const cmd = "cndi destroy";

    const pathToTerraformResources = path.join(
      options.path,
      "cndi",
      "terraform",
    );

    const pathToTerraformBinary = getPathToTerraformBinary();

    try {
      setTF_VARs(options.path); // set TF_VARs using CNDI's .env variables
    } catch (setTF_VARsError) {
      console.error(setTF_VARsError.message);
      await emitExitEvent(setTF_VARsError.cause);
      Deno.exit(setTF_VARsError.cause);
    }

    try {
      await pullStateForRun({ pathToTerraformResources, cmd });
    } catch (pullStateForRunError) {
      console.error(pullStateForRunError.message);
      await emitExitEvent(pullStateForRunError.cause);
      Deno.exit(pullStateForRunError.cause);
    }

    try {
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
        console.error(destroyLabel, ccolors.error("terraform init failed"));
        Deno.exit(terraformInitCommandOutput.code);
      }
    } catch (terraformInitError) {
      console.error(
        destroyLabel,
        ccolors.error("failed to spawn 'terraform init'"),
      );
      console.error(ccolors.caught(terraformInitError, 1400));
      await emitExitEvent(1400);
      Deno.exit(1400);
    }

    try {
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

      try {
        await pushStateFromRun({ pathToTerraformResources, cmd });
      } catch (pushStateFromRunError) {
        console.error(pushStateFromRunError.message);
        await emitExitEvent(pushStateFromRunError.cause);
        Deno.exit(pushStateFromRunError.cause);
      }

      // if `terraform destroy` fails, exit with the code
      if (status.code !== 0) {
        const cndiExitCode = parseInt(
          `${PROCESS_ERROR_CODE_PREFIX.terraform}${status.code}`,
        );
        await emitExitEvent(cndiExitCode);
        Deno.exit(status.code);
      }
    } catch (cndiDestroyError) {
      console.error(
        destroyLabel,
        ccolors.error("failed to spawn 'terraform destroy'"),
      );
      console.error(ccolors.caught(cndiDestroyError, 1401));
      await emitExitEvent(1401);
      Deno.exit(1401);
    }
    await emitExitEvent(0);
  });

export default destroyCommand;
