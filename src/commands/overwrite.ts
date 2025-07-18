import { Command, Spinner, WorkflowType } from "deps";
import {
  emitExitEvent,
  getProjectDirectoryFromFlag,
  getStagingDirectory,
} from "src/utils.ts";
import createRepo from "src/actions/createRepo.ts";

type EchoOwOptions = {
  file?: string;
  output?: string;
  initializing?: boolean;
};

export type OwActionOptions = {
  initializing: boolean;
  create: boolean;
  skipPush: boolean;
  file?: string;
  output: string;
  runWorkflowSourceRef?: string;
  updateWorkflow?: ("run" | "check")[];
};

const echoOw = (options: EchoOwOptions) => {
  if (options?.initializing) return;

  const cndiOverwrite = "cndi overwrite";
  const cndiOverwriteFile = options.file ? ` --file ${options.file}` : "";
  const cndiOverwriteOutput = options.output
    ? ` --output ${options.output}`
    : "";
  console.log(`${cndiOverwrite}${cndiOverwriteFile}${cndiOverwriteOutput}\n`);
};

const owAction = async (options: OwActionOptions) => {
  echoOw(options);

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

  const [err, stagingDirectory] = getStagingDirectory();

  if (err) {
    spinner.stop();
    await err.out();
    return;
  }

  const w = new Worker(import.meta.resolve("src/actions/overwrite.worker.ts"), {
    type: "module",
  });

  w.postMessage({
    options,
    type: "begin-overwrite",
    globalThis: { stagingDirectory },
  });

  w.onmessage = async (e) => {
    console.log();
    if (e.data.type === "complete-overwrite") {
      w.terminate();
      spinner.stop();
      if (options.create) {
        const error = await createRepo(options);
        if (error) {
          await error.out();
          return;
        }
      }
      await emitExitEvent(0);
      Deno.exit(0);
    } else if (e.data.type === "error-overwrite") {
      spinner.stop();
      w.terminate();
      console.log();
      console.error(e?.data?.message || "");
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
    "File system path to your cndi project's git repository.",
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
  .option(
    "--skip-push <skip-push:boolean>",
    "Skip pushing to remote repository",
    { hidden: true, default: false },
  )
  .option(
    "-w, --workflow-source-ref <workflow_source_ref:string>",
    "Specify a ref to build a cndi-run workflow with",
    {
      hidden: true,
    },
  )
  .type("workflow", WorkflowType)
  .option("--update-workflow <items:workflow[]>", "Update GitHub Workflows")
  .action((options) => {
    const output = options?.output || Deno.cwd();
    const updateWorkflows = options?.updateWorkflow || [];

    owAction({
      ...options,
      output,
      updateWorkflow: updateWorkflows,
    });
  });

export { overwriteCommand, owAction };
