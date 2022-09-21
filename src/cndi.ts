
import * as flags from "https://deno.land/std@0.156.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.156.0/path/mod.ts";
import "https://deno.land/std@0.156.0/dotenv/load.ts"; // loads contents of .env into Deno.env automatically


import { Command } from "./types.ts";

// import * as GCPComputeEngine from 'https://esm.sh/@google-cloud/compute';
// TODO: const gcpClient = new GCPComputeEngine.InstancesClient();

import runFn from "./commands/run.ts";
import initFn from "./commands/init.ts";
import overwriteWithFn from "./commands/overwrite-with.ts";
import helpFn from "./commands/help.ts";

export default function main(args: string[]) {
  const CNDI_SRC = path.dirname(path.fromFileUrl(import.meta.url));
  const CNDI_HOME = path.join(CNDI_SRC, "..");
  const CNDI_WORKING_DIR = path.join(CNDI_HOME, ".working");
  // default paths to the user's config file
  const DEFAULT_CNDI_CONFIG_PATH = path.join(CNDI_HOME, "cndi-config.json");
  const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`;

  // parse the command line arguments
  const cndiArguments = flags.parse(args);

  // if the user has specified a config file, use that, otherwise use the default config file
  const pathToConfig =
    cndiArguments.f ||
    cndiArguments.file ||
    DEFAULT_CNDI_CONFIG_PATH_JSONC ||
    DEFAULT_CNDI_CONFIG_PATH;

  // the directory in which to create the cndi folder
  const outputOption = cndiArguments.o || cndiArguments.output || CNDI_HOME;
  const outputDirectory = path.join(outputOption, "cndi");
  const pathToNodes = path.join(outputDirectory, "nodes.json");
  // github actions setup
  const githubDirectory = path.join(outputOption, ".github");
  const noGitHub = cndiArguments["no-github"] || false;

  const context = {
    CNDI_HOME,
    CNDI_SRC,
    CNDI_WORKING_DIR,
    outputDirectory,
    githubDirectory,
    noGitHub,
    pathToConfig,
    pathToNodes
  };

  // map command to function
  const commands = {
    [Command.init]: initFn,
    [Command["overwrite-with"]]: overwriteWithFn,
    [Command.run]: runFn,
    [Command.help]: helpFn,
    [Command.default]: (c: string) => {
      console.log(
        `Command "${c}" not found. Use "cndi --help" for more information.`
      );
    },
  };

  const commandsInArgs = cndiArguments._;

  // if the user uses --help we will show help text
  if (cndiArguments.help || cndiArguments.h) {
    const key =
      typeof cndiArguments.help === "boolean" ? "default" : cndiArguments.help;
    commands.help(key);

    // if the user tries to run "help" instead of --help we will say that it's not a valid command
  } else if (commandsInArgs.includes("help")) {
    commands.help(Command.help);
  } else {
    // in any other case we will try to run the command
    const operation = `${commandsInArgs[0]}`;
    switch (operation) {
      case Command.init:
        commands[Command.init](context);
        break;
      case Command.run:
        commands[Command.run](context);
        break;
      case Command["overwrite-with"]:
        commands[Command["overwrite-with"]](context);
        break;
      default:
        commands[Command.default](operation);
        break;
    }
  }
}
