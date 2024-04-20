import deno_json from "../deno.json" with { type: "json" };
import "https://deno.land/std@0.196.0/dotenv/load.ts";
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
import terraformCommand from "src/commands/terraform.ts";
import destroyCommand from "src/commands/destroy.ts";
import installCommand from "src/commands/install.ts";
import getOutputsCommand from "src/commands/get-outputs.ts";

import { emitExitEvent, removeOldBinaryIfRequired } from "src/utils.ts";

const cndiLabel = ccolors.faded("\nsrc/cndi.ts:");

export default async function cndi() {
  if (!deno_json?.version) {
    throw new Error("deno.json is missing a version");
  }

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
    console.log(ccolors.caught(failedToCreateStagingDirectoryError, 1));
    await emitExitEvent(1);
    Deno.exit(1);
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
    .command("terraform", terraformCommand)
    .command("destroy", destroyCommand)
    .command("upgrade", upgradeCommand)
    .command("install", installCommand)
    .command("get-outputs", getOutputsCommand)
    .command("completions", new CompletionsCommand().global())
    .command("help", new HelpCommand().global())
    .parse(Deno.args);
}
