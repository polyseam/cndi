import path from "https://deno.land/std@0.173.0/node/path.ts";
import { writableStreamFromWriter } from "https://deno.land/std@0.177.0/streams/writable_stream_from_writer.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { SpinnerTypes } from "https://deno.land/x/spinners@v1.1.2/spinner-types.ts";
import { TerminalSpinner } from "https://deno.land/x/spinners@v1.1.2/terminal-spinner.ts";
import { checkInstalled, getFileSuffixForPlatform } from "./utils.ts";

const installLabel = colors.white("\nsrc/install:");

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
      console.log(
        installLabel,
        colors.brightRed("\nfailed to install terraform, please try again"),
      );
      console.log(terraformInstallError);
      Deno.exit(1);
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
      console.log(
        installLabel,
        colors.brightRed("\nfailed to install kubeseal, please try again"),
      );
      console.log(kubesealInstallError);
      Deno.exit(1);
    }
    console.log();
    spinner.succeed("cndi dependencies installed!\n");
  }
}
