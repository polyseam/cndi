import { Command, Spinner } from "deps";
import { emitExitEvent, getProjectDirectoryFromFlag } from "src/utils.ts";
import createRepo from "src/actions/createRepo.ts";

// deno-lint-ignore no-explicit-any
const owAction = (args: any) => {
  if (!args.initializing) {
    if (args.file) {
      console.log(`cndi overwrite --file "${args.file}"\n`);
    } else {
      console.log(`cndi overwrite\n`);
    }
  }

  const spinner = new Spinner({
    interval: 80,
    color: "cyan",
    spinner: [
      "▰▱▱▱▱▱▱",
      "▰▰▱▱▱▱▱",
      "▰▰▰▱▱▱▱",
      "▰▰▰▰▱▱▱",
      "▰▰▰▰▰▱▱",
      "▰▰▰▰▰▰▱",
      "▰▰▰▰▰▰▰",
      "▰▱▱▱▱▱▱",
    ],
  });

  spinner.start();

  const w = new Worker(import.meta.resolve("src/actions/overwrite.worker.ts"), {
    type: "module",
  });

  w.postMessage({ args, type: "begin-overwrite" });

  w.onmessage = async (e) => {
    console.log();
    if (e.data.type === "complete-overwrite") {
      w.terminate();
      spinner.stop();
      if (args.create) {
        await createRepo(args);
      }
      await emitExitEvent(0);
      Deno.exit(0);
    } else if (e.data.type === "error-overwrite") {
      spinner.stop();
      w.terminate();
      console.log();
      console.log(e?.data?.message || "");
      await emitExitEvent(e.data.code);
      Deno.exit(e.data.code);
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
    getProjectDirectoryFromFlag,
  )
  .option(
    "--initializing <initializing:boolean>",
    'true if "cndi init" is the caller of this command',
    { hidden: true, default: false },
  )
  .option(
    "--create <create:boolean>",
    "Create a new cndi cluster repository",
    { hidden: true, default: false },
  )
  .action(owAction);

export { overwriteCommand, owAction };
