import deno_json from "../deno.json" with { type: "json" };
import "@std/dotenv/load";
import {
  ccolors,
  Command,
  CompletionsCommand,
  ensureDirSync,
  homedir,
  path,
} from "deps";
import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "consts";
import { ErrOut } from "errout";

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

const label = ccolors.faded("\nsrc/cndi.ts:");

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
  } catch (errorEnsuringDirectory) {
    const err = new ErrOut([
      ccolors.error(`Could not create staging directory`),
      ccolors.key_name(`"${stagingDirectory}"`),
    ], {
      label,
      code: 10,
      id: "error-ensuring-stagingDirectory",
      cause: errorEnsuringDirectory as Error,
    });
    await err.out();
    return;
  }

  return await new Command()
    .name("cndi")
    .version(`v${CNDI_VERSION}`)
    .description("Cloud-Native Data Infrastructure")
    .meta("kubeseal", `v${KUBESEAL_VERSION}`)
    .meta("terraform", `v${TERRAFORM_VERSION}`)
    .globalOption("--welcome", "a new user has arrived!", {
      hidden: true,
    })
    .command("create", createCommand)
    .command("init", initCommand)
    .command("overwrite", overwriteCommand)
    .command("run", runCommand)
    .command("destroy", destroyCommand)
    .command("upgrade", upgradeCommand)
    .command("install", installCommand) // backwards compatibility noop
    .command("show-outputs", showOutputsCommand)
    .command("completions", new CompletionsCommand().global())
    .helpOption("-h, --help", "Show this help.", {
      action: async function (this) {
        console.log();
        console.log("HELPING");
        console.log();
        this.showHelp();
        await emitExitEvent(0);
        Deno.exit(0);
      },
      standalone: false,
      global: true,
    })
    .parse(Deno.args);
}
