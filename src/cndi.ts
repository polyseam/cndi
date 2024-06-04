import deno_json from "../deno.json" with { type: "json" };
import { loadSync } from "@std/dotenv";
// import "@std/dotenv/load";

import {
  ccolors,
  Command,
  CompletionsCommand,
  ensureDirSync,
  HelpCommand,
  homedir,
  path,
} from "deps";
import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "consts";

// commands
import upgradeCommand from "src/commands/upgrade.ts";
import runCommand from "src/commands/run.ts";
import createCommand from "src/commands/create.ts";
import initCommand from "src/commands/init.ts";
import { overwriteCommand } from "src/commands/overwrite.ts";
import destroyCommand from "src/commands/destroy.ts";
import installCommand from "src/commands/install.ts";
import showOutputsCommand from "src/commands/show-outputs.ts";

import { emitExitEvent, removeOldBinaryIfRequired } from "src/utils.ts";

const cndiLabel = ccolors.faded("\nsrc/cndi.ts:");

export default async function cndi() {
  if (!deno_json?.version) {
    throw new Error("deno.json is missing a version");
  }

  loadSync({
    export: true,
    envPath: path.join(Deno.cwd(), ".env"),
    examplePath: null,
    defaultsPath: null,
  });

  const isDebug = Deno.env.get("CNDI_TELEMETRY") === "debug";

  if (isDebug) {
    console.log(
      "using",
      ccolors.warn(`${Math.floor(Deno.memoryUsage().rss / 1_000_000)}mb`),
      "of RAM\n",
    );
  }

  const DEFAULT_CNDI_HOME = path.join(homedir(), ".cndi");

  const CNDI_VERSION = `${deno_json?.version}`;
  const CNDI_HOME = Deno.env.get("CNDI_HOME") || DEFAULT_CNDI_HOME;
  const timestamp = `${Date.now()}`;
  const stagingDirectory = path.join(CNDI_HOME, "staging", timestamp);

  // if cndi was updated in the previous execution, remove the old unused binary
  // this is necessary because Windows will not allow you to delete a binary while it is running
  await removeOldBinaryIfRequired(CNDI_HOME);

  Deno.env.set("CNDI_STAGING_DIRECTORY", stagingDirectory);
  Deno.env.set("CNDI_HOME", CNDI_HOME);

  try {
    ensureDirSync(stagingDirectory);
  } catch (failedToCreateStagingDirectoryError) {
    console.error(
      cndiLabel,
      ccolors.error(`Could not create staging directory`),
      ccolors.key_name(`"${stagingDirectory}"`),
    );
    console.error(ccolors.caught(failedToCreateStagingDirectoryError, 10));
    await emitExitEvent(10);
    Deno.exit(10);
  }

  return await new Command()
    .name("cndi")
    .version(`v${CNDI_VERSION}`)
    .description("Cloud-Native Data Infrastructure")
    .meta("kubeseal", `v${KUBESEAL_VERSION}`)
    .meta("terraform", `v${TERRAFORM_VERSION}`)
    .command("create", createCommand)
    .command("init", initCommand)
    .command("overwrite", overwriteCommand)
    .command("run", runCommand)
    .command("destroy", destroyCommand)
    .command("upgrade", upgradeCommand)
    .command("install", installCommand)
    .command("show-outputs", showOutputsCommand)
    .command("completions", new CompletionsCommand().global())
    .command("help", new HelpCommand().global())
    .parse(Deno.args);
}
