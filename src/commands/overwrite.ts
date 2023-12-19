import { Command } from "deps";

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
  .action(async (...args) => {
    const owMod = await import("../actions/overwrite.ts");
    owMod.overwriteAction(...args);
  });

export { overwriteCommand };
