import { Command, delay, Spinners, TerminalSpinner } from "deps";

const getOwModule = async () => {
  const spinner = new TerminalSpinner({
    text: "loading terraform modules...",
    color: "cyan",
    indent: 0,
    spinner: Spinners.windows,
    writer: Deno.stdout,
  });

  spinner.start();
  await delay(1000); // let the spinner start to spin
  const owMod = await import("src/actions/overwrite.ts");
  spinner.succeed("terraform modules loaded!\n");
  return owMod;
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
  .action(async (...args) => {
    const owMod = await getOwModule();
    owMod.overwriteAction(...args);
  });

export { getOwModule, overwriteCommand };
