import "https://deno.land/std@0.173.0/dotenv/load.ts";

import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { getFileSuffixForPlatform } from "../utils.ts";
import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "../deps.ts";
const installLabel = colors.white("install:");

import { writableStreamFromWriter } from "https://deno.land/std@0.173.0/streams/mod.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import {
  SpinnerTypes,
  TerminalSpinner,
} from "https://deno.land/x/spinners@v1.1.2/mod.ts";

/**
 * COMMAND cndi install
 * installs cndi's dependencies and prepares the software for use
 */
const installCommand = new Command()
  .description(`Install cndi dependencies.`)
  .action(async () => {
    const CNDI_HOME = Deno.env.get("CNDI_HOME")!;

    const fileSuffixForPlatform = getFileSuffixForPlatform();
    const spinner = new TerminalSpinner({
      text: "cndi installing",
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
      }
    } catch (terraformInstallError) {
      console.log(
        installLabel,
        colors.brightRed("\n failed to install terraform, please try again"),
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
      }
    } catch (kubesealInstallError) {
      console.log(
        installLabel,
        colors.brightRed("\n failed to install kubeseal, please try again"),
      );
      console.log(kubesealInstallError);
      Deno.exit(1);
    }

    spinner.succeed("cndi installed");
  });

export default installCommand;
