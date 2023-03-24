import {
  ccolors,
  path,
  SpinnerTypes,
  TerminalSpinner,
  writableStreamFromWriter,
} from "deps";

import {
  checkInstalled,
  emitExitEvent,
  getFileSuffixForPlatform,
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
  if (force || !(await checkInstalled(CNDI_HOME))) {
    console.log(force ? "" : "cndi dependencies not installed!\n");

    const CNDI_HOME = Deno.env.get("CNDI_HOME")!;
    await Deno.mkdir(CNDI_HOME, { recursive: true });

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

    const terraformBinaryPath = path.join(
      CNDI_HOME,
      `terraform-${fileSuffixForPlatform}`,
    );

    try {
      const terraformFileResponse = await fetch(terraformBinaryURL);
      if (terraformFileResponse.body) {
        const terraformFile = await Deno.open(terraformBinaryPath, {
          create: true,
          write: true,
          mode: 0o777,
        });
        const terraformWritableStream = writableStreamFromWriter(terraformFile);
        await terraformFileResponse.body.pipeTo(terraformWritableStream);
        console.log("\n    terraform installed!\n");
      }
    } catch (terraformInstallError) {
      console.error(
        installLabel,
        ccolors.error("\nfailed to install terraform, please try again"),
      );
      console.log(ccolors.caught(terraformInstallError));

      await emitExitEvent(300);
      Deno.exit(300);
    }

    const kubesealBinaryPath = path.join(
      CNDI_HOME,
      `kubeseal-${fileSuffixForPlatform}`,
    );

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
        const kubesealWritableStream = writableStreamFromWriter(kubesealFile);
        await kubesealFileResponse.body.pipeTo(kubesealWritableStream);
        console.log("\n    kubeseal installed!\n");
      }
    } catch (kubesealInstallError) {
      console.error(
        installLabel,
        ccolors.error("\nfailed to install kubeseal, please try again"),
      );
      console.log(ccolors.caught(kubesealInstallError));
      await emitExitEvent(301);
      Deno.exit(301);
    }
    console.log();
    spinner.succeed("cndi dependencies installed!\n");
  }
}
