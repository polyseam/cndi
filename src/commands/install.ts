import { CNDIContext } from "../types.ts";
import { embeddedFiles } from "../installer/embedded/all.ts";
import { writableStreamFromWriter } from "https://deno.land/std@0.157.0/streams/mod.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import {
  SpinnerTypes,
  TerminalSpinner,
} from "https://deno.land/x/spinners@v1.1.2/mod.ts";

/**
 * COMMAND fn: cndi install
 * Initializes ~/.cndi directory with required resources
 */

type EmbeddedFileKey = keyof typeof embeddedFiles;

export default async function install(context: CNDIContext) {
  const spinner = new TerminalSpinner({
    text: "cndi installing",
    color: "cyan",
    indent: 2,
    spinner: SpinnerTypes.windows,
    writer: Deno.stdout,
  });

  spinner.start();

  const { CNDI_HOME, fileSuffixForPlatform } = context;
  Object.keys(embeddedFiles).forEach((key) => {
    const k = key as EmbeddedFileKey;
    const folder = path.dirname(k) as string;

    const file = embeddedFiles[k];
    Deno.mkdirSync(path.join(CNDI_HOME, folder), { recursive: true });
    Deno.writeTextFileSync(path.join(CNDI_HOME, key), file, {
      create: true,
      append: false,
    });
  });

  // TODO: configurable?
  const version = "1.3.2";

  const terraformBinaryURL =
    `https://cndi-binaries.s3.amazonaws.com/terraform/${version}/terraform-${fileSuffixForPlatform}`;

  const terraformBinaryPath = path.join(
    CNDI_HOME,
    `terraform-${fileSuffixForPlatform}`,
  );

  const fileResponse = await fetch(terraformBinaryURL);

  if (fileResponse.body) {
    const file = await Deno.open(terraformBinaryPath, {
      create: true,
      write: true,
      mode: 0o777,
    });
    const writableStream = writableStreamFromWriter(file);
    await fileResponse.body.pipeTo(writableStream);
    spinner.succeed("cndi installed");
  }
}
