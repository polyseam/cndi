import { pullStateForTerraform } from "src/tfstate/git/read-state.ts";
import { pushStateFromTerraform } from "src/tfstate/git/write-state.ts";
import { getTF_VARs } from "../getTF_VARs.ts";
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
    `Destroy cndi cluster.`,
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

    const [setTF_VARsError, env] = await getTF_VARs(options.path);

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
        args: [
          `-chdir=${pathToTerraformResources}`,
          "init",
        ],
        stderr: "piped",
        stdout: "piped",
        env,
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
      console.error(ccolors.caught(terraformInitError as Error, 1400));
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
        env,
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

      const pushStateError = await pushStateFromTerraform({
        pathToTerraformResources,
        cmd,
      });

      if (pushStateError) {
        await pushStateError.out();
        return;
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
      console.error(ccolors.caught(cndiDestroyError as Error, 1401));
      await emitExitEvent(1401);
      Deno.exit(1401);
    }
    await emitExitEvent(0);
  });

export default destroyCommand;
