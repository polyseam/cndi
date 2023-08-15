import {
  ccolors,
  exists,
  path,
  platform,
  SpinnerTypes,
  TerminalSpinner,
} from "deps";

import {
  checkInstalled,
  emitExitEvent,
  getFileSuffixForPlatform,
  getPathToKubesealBinary,
  getPathToTerraformBinary,
} from "src/utils.ts";

const installLabel = ccolors.faded("\nsrc/install.ts:");

interface InstallDependenciesIfRequiredOptions {
  CNDI_HOME: string;
  KUBESEAL_VERSION: string;
  TERRAFORM_VERSION: string;
}

export default async function installDependenciesIfRequired(
  {
    KUBESEAL_VERSION,
    TERRAFORM_VERSION,
    CNDI_HOME,
  }: InstallDependenciesIfRequiredOptions,
  force?: boolean,
) {
  const isWindows = platform() === "win32";
  const pathToGarbageBinary = isWindows
    ? path.join(CNDI_HOME, "bin", "cndi-old.exe")
    : path.join(CNDI_HOME, "bin", "cndi-old");

  // clean up garbage binary from previous release
  if (await exists(pathToGarbageBinary)) {
    try {
      await Deno.remove(pathToGarbageBinary);
    } catch (deletionError) {
      if (deletionError instanceof Deno.errors.NotFound) {
        // garbage bin probably doesn't exist, thats fine
      } else {
        console.error(
          installLabel,
          ccolors.error("\nfailed to delete old"),
          ccolors.key_name("cndi"),
          ccolors.error("binary, please try again"),
        );
        console.log(ccolors.caught(deletionError, 302));
        await emitExitEvent(302);
        Deno.exit(302);
      }
    }
  }

  if (force || !(await checkInstalled(CNDI_HOME))) {
    console.log(force ? "" : "cndi dependencies not installed!\n");

    const fileSuffixForPlatform = getFileSuffixForPlatform();

    const spinner = new TerminalSpinner({
      text: "installing cndi dependencies...",
      color: "cyan",
      indent: 2,
      spinner: SpinnerTypes.windows,
      writer: Deno.stdout,
    });

    spinner.start();

    const terraformBinaryURL =
      `https://cndi-binaries.s3.amazonaws.com/terraform/v${TERRAFORM_VERSION}/terraform-${fileSuffixForPlatform}`;

    const terraformBinaryPath = getPathToTerraformBinary();

    try {
      const terraformFileResponse = await fetch(terraformBinaryURL);
      if (terraformFileResponse.body) {
        const terraformFile = await Deno.open(terraformBinaryPath, {
          create: true,
          write: true,
          mode: 0o777,
        });
        await terraformFileResponse.body.pipeTo(terraformFile.writable, {
          preventClose: true,
        });
        terraformFile.close();
        console.log("\n    terraform installed!\n");
      }
    } catch (terraformInstallError) {
      console.error(
        installLabel,
        ccolors.error("\nfailed to install terraform, please try again"),
      );
      console.log(ccolors.caught(terraformInstallError, 300));

      await emitExitEvent(300);
      Deno.exit(300);
    }

    const kubesealBinaryPath = getPathToKubesealBinary();

    const kubesealBinaryURL =
      `https://cndi-binaries.s3.amazonaws.com/kubeseal/v${KUBESEAL_VERSION}/kubeseal-${fileSuffixForPlatform}`;
    try {
      const kubesealFileResponse = await fetch(kubesealBinaryURL);

      if (kubesealFileResponse.body) {
        const kubesealFile = await Deno.open(kubesealBinaryPath, {
          create: true,
          write: true,
          mode: 0o777,
        });
        await kubesealFileResponse.body.pipeTo(kubesealFile.writable, {
          preventClose: true,
        });
        kubesealFile.close();
        console.log("\n    kubeseal installed!\n");
      }
    } catch (kubesealInstallError) {
      console.error(
        installLabel,
        ccolors.error("\nfailed to install kubeseal, please try again"),
      );
      console.log(ccolors.caught(kubesealInstallError, 301));
      await emitExitEvent(301);
      Deno.exit(301);
    }
    console.log();
    spinner.succeed("cndi dependencies installed!\n");
  }
}
