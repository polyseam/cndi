import * as flags from "https://deno.land/std@0.157.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import "https://deno.land/std@0.157.0/dotenv/load.ts"; // loads contents of .env into Deno.env automatically
import { platform } from "https://deno.land/std@0.157.0/node/os.ts";
import { homedir } from "https://deno.land/std@0.157.0/node/os.ts?s=homedir";
import { checkInstalled } from "./utils.ts";
import { Command } from "./types.ts";
import { brightRed, cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";

// import * as GCPComputeEngine from 'https://esm.sh/@google-cloud/compute';
// TODO: const gcpClient = new GCPComputeEngine.InstancesClient();

import runFn from "./commands/run.ts";
import initFn from "./commands/init.ts";
import overwriteWithFn from "./commands/overwrite-with.ts";
import helpFn from "./commands/help.ts";
import installFn from "./commands/install.ts";

const binaryForPlatform = {
  linux: "linux",
  darwin: "macos",
  win32: "win.exe",
};

export default async function main(args: string[]) {
  const currentPlatform = platform() as "linux" | "darwin" | "win32";
  const executionDirectory = Deno.cwd();
  const homeDirectory = homedir() || "~";
  const CNDI_HOME = path.join(homeDirectory, ".cndi");

  // CNDI_SRC is determined at compile time, that's no good
  const CNDI_SRC = path.join(CNDI_HOME, "src");
  const CNDI_WORKING_DIR = path.join(CNDI_HOME, ".working");

  // default paths to the user's config file
  const DEFAULT_CNDI_CONFIG_PATH = path.join(
    executionDirectory,
    "cndi-config.json",
  );

  const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`;

  // parse the command line arguments
  const cndiArguments = flags.parse(args);

  // if the user has specified a config file, use that, otherwise use the default config file
  const pathToConfig = cndiArguments.f ||
    cndiArguments.file ||
    DEFAULT_CNDI_CONFIG_PATH_JSONC ||
    DEFAULT_CNDI_CONFIG_PATH;

  // the directory in which to create the cndi folder
  const outputOption = cndiArguments.o || cndiArguments.output ||
    executionDirectory;
  const outputDirectory = path.join(outputOption, "cndi");
  const pathToNodes = path.join(outputDirectory, "nodes.json");
  // github actions setup
  const githubDirectory = path.join(outputOption, ".github");
  const dotEnvPath = path.join(outputOption, ".env");

  const noGitHub = cndiArguments["no-github"] || false;
  const noDotEnv = cndiArguments["no-dotenv"] || false;

  const context = {
    CNDI_HOME, // ~/.cndi (or equivalent) (default)
    CNDI_SRC, // ~/.cndi/src (default)
    CNDI_WORKING_DIR, // ~/.cndi/.working (default)
    outputDirectory, // Deno.cwd()/cndi (default)
    githubDirectory, // Deno.cwd()/.github (default)
    dotEnvPath, // Deno.cwd()/.env (default)
    noGitHub,
    noDotEnv,
    pathToConfig,
    pathToNodes,
    binaryForPlatform: binaryForPlatform[currentPlatform],
  };

  // map command to function
  const commands = {
    [Command.init]: initFn,
    [Command["overwrite-with"]]: overwriteWithFn,
    [Command.ow]: overwriteWithFn,
    [Command.run]: runFn,
    [Command.help]: helpFn,
    [Command.install]: installFn,
    [Command.default]: (c: string) => {
      console.log(
        `Command "${c}" not found. Use "cndi --help" for more information.`,
      );
    },
  };

  const commandsInArgs = cndiArguments._;

  // if the user uses --help we will show help text
  if (cndiArguments.help || cndiArguments.h) {
    const key = typeof cndiArguments.help === "boolean"
      ? "default"
      : cndiArguments.help;
    commands.help(key);

    // if the user tries to run "help" instead of --help we will say that it's not a valid command
  } else if (commandsInArgs.includes("help")) {
    commands.help(Command.help);
  } else {
    // in any other case we will try to run the command
    const operation = `${commandsInArgs[0]}`;

    if (operation !== "install") {
      // One time only setup
      if (!(await checkInstalled(context))) {
        console.error(
          brightRed("\ncndi is not installed!\nrun"),
          cyan("cndi install"),
          brightRed("and try again.\n"),
        );
        Deno.exit(1);
      }
    }

    switch (operation) {
      case Command.install:
        commands[Command.install](context);
        break;
      case Command.init:
        commands[Command.init](context);
        break;
      case Command.run:
        commands[Command.run](context);
        break;
      case Command["overwrite-with"]:
        commands[Command["overwrite-with"]](context);
        break;
      case Command.ow:
        commands[Command["overwrite-with"]](context);
        break;
      default:
        commands[Command.default](operation);
        break;
    }
  }
}
