import { CNDIContext } from "../types.ts";
import { embeddedFiles } from "../installer/embedded/all.ts";
import { writableStreamFromWriter } from "https://deno.land/std@0.173.0/streams/mod.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import {
  SpinnerTypes,
  TerminalSpinner,
} from "https://deno.land/x/spinners@v1.1.2/mod.ts";

/**
 * COMMAND fn: cndi install
 * Initializes ~/.cndi directory with required resources
 */

type EmbeddedFileKey = keyof typeof embeddedFiles;

export default async function install(
  { CNDI_HOME, fileSuffixForPlatform }: CNDIContext,
) {
  const spinner = new TerminalSpinner({
    text: "cndi installing",
    color: "cyan",
    indent: 2,
    spinner: SpinnerTypes.windows,
    writer: Deno.stdout,
  });

  spinner.start();

  for (const key in embeddedFiles) {
    const k = key as EmbeddedFileKey;
    const folder = path.dirname(k) as string;

    const file = embeddedFiles[k];
    await Deno.mkdir(path.join(CNDI_HOME, folder), { recursive: true });
    await Deno.writeTextFile(path.join(CNDI_HOME, key), file, {
      create: true,
      append: false,
    });
  }

  // TODO: configurable?
  const terraformVersion = "1.3.2";

  const terraformBinaryURL =
    `https://cndi-binaries.s3.amazonaws.com/terraform/${terraformVersion}/terraform-${fileSuffixForPlatform}`;

  const terraformBinaryPath = path.join(
    CNDI_HOME,
    `terraform-${fileSuffixForPlatform}`,
  );

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

  const kubesealBinaryPath = path.join(
    CNDI_HOME,
    `kubeseal-${fileSuffixForPlatform}`,
  );

  const kubesealVersion = "v0.19.1";

  const kubesealBinaryURL =
    `https://cndi-binaries.s3.amazonaws.com/kubeseal/${kubesealVersion}/kubeseal-${fileSuffixForPlatform}`;

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

  spinner.succeed("cndi installed");
}
