import { Command, Spinners, TerminalSpinner } from "deps";

// deno-lint-ignore no-explicit-any
const owAction = (args: any) => {
  const spinner = new TerminalSpinner({
    text: "generating manifests and resources...",
    color: "cyan",
    spinner: Spinners.dots,
    writer: Deno.stdout,
  });

  const w = new Worker(import.meta.resolve("src/actions/overwrite.worker.ts"), {
    type: "module",
  });

  w.postMessage({ args, type: "begin-overwrite" });
  spinner.start();
  w.onmessage = (e) => {
    if (e.data.type === "overwrite-complete") {
      spinner.succeed();
      w.terminate();
    }
  };
};

/**
 * COMMAND cndi overwrite
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const overwriteCommand = new Command()
  .description(`Update cndi project files using cndi_config.yaml file.`)
  .alias("ow")
  .option("-f, --file <file:string>", "Path to your cndi_config file.")
  .option(
    "-o, --output <output:string>",
    "Path to your cndi cluster git repository.",
    {
      default: Deno.cwd(),
    },
  )
  .option(
    "--initializing <initializing:boolean>",
    'true if "cndi init" is the caller of this command',
    { hidden: true, default: false },
  )
  .action(owAction);

export { overwriteCommand, owAction };
