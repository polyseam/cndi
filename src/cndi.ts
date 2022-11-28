import * as flags from "https://deno.land/std@0.157.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import "https://deno.land/std@0.157.0/dotenv/load.ts"; // loads contents of .env into Deno.env automatically
import { homedir } from "https://deno.land/std@0.157.0/node/os.ts?s=homedir";
import {
  checkInstalled,
  getFileSuffixForPlatform,
  getPathToOpenSSLForPlatform,
} from "./utils.ts";
import { Command } from "./types.ts";
import {
  brightRed,
  cyan,
  white,
  yellow,
} from "https://deno.land/std@0.158.0/fmt/colors.ts";

import runFn from "./commands/run.ts";
import initFn from "./commands/init.ts";
import overwriteWithFn from "./commands/overwrite-with.ts";
import helpFn from "./commands/help.ts";
import installFn from "./commands/install.ts";
import terraformFn from "./commands/terraform.ts";

const cndiLabel = white("cndi:");

export default async function main(args: string[]) {
  console.log(); /* blank line */
  const fileSuffixForPlatform = getFileSuffixForPlatform();
  const pathToOpenSSL = getPathToOpenSSLForPlatform();
  const executionDirectory = Deno.cwd();
  const homeDirectory = homedir() || "~";
  const CNDI_HOME = path.join(homeDirectory, ".cndi");

  // CNDI_SRC is determined at compile time, that's no good
  const CNDI_SRC = path.join(CNDI_HOME, "src");
  const pathToKubeseal = path.join(
    CNDI_HOME,
    `kubeseal-${fileSuffixForPlatform}`,
  );

  // default paths to the user's config file
  const DEFAULT_CNDI_CONFIG_PATH = path.join(
    executionDirectory,
    "cndi-config.json",
  );

  const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`;

  // parse the command line arguments
  const cndiArguments = flags.parse(args);

  const template = cndiArguments.t || cndiArguments.template || null;

  if (template && (cndiArguments.f || cndiArguments.file)) {
    const templateArg = cndiArguments.template ? "--template" : "-t";
    const fileArg = cndiArguments.file ? "--file" : "-f";

    console.log(
      cndiLabel,
      `${
        brightRed(
          `You used "${fileArg}" and "${templateArg}", you need to choose one or the other.`,
        )
      }\n`,
    );
    console.log(
      yellow(`did you mean to use "--output" instead of "${fileArg}"?\n`),
    );
    Deno.exit(1);
  }

  // use an interactive prompt if the user enables it
  const interactive = cndiArguments.i || cndiArguments.interactive || false;

  // if the user has specified a config file, use that, otherwise use the default config file
  const pathToConfig = template ? null : cndiArguments.f ||
    cndiArguments.file ||
    DEFAULT_CNDI_CONFIG_PATH_JSONC ||
    DEFAULT_CNDI_CONFIG_PATH;

  // the directory in which to create the cndi folder
  const outputOption = cndiArguments.o || cndiArguments.output ||
    executionDirectory;

  const projectDirectory = path.join(outputOption);

  const projectCndiDirectory = path.join(projectDirectory, "cndi");

  // github actions setup
  const githubDirectory = path.join(outputOption, ".github");
  const dotEnvPath = path.join(outputOption, ".env");

  const noGitHub = cndiArguments["no-github"] || false;
  const noDotEnv = cndiArguments["no-dotenv"] || false;
  const noKeys = cndiArguments["no-keys"] || false;

  const pathToTerraformBinary = path.join(
    CNDI_HOME,
    `terraform-${fileSuffixForPlatform}`,
  );

  const pathToCNDIBinary = path.join(
    CNDI_HOME,
    `cndi-${fileSuffixForPlatform}`,
  );

  const pathToTerraformResources = path.join(projectCndiDirectory, "terraform");
  const pathToKubernetesManifests = path.join(projectCndiDirectory, "cluster");
  const gitignorePath = path.join(projectDirectory, ".gitignore");
  const pathToKeys = path.join(outputOption, ".keys");

  const context = {
    CNDI_HOME, // ~/.cndi (or equivalent) (default)
    CNDI_SRC, // ~/.cndi/src (default)
    template, // the name of the config file in /templates to use
    projectDirectory,
    projectCndiDirectory,
    githubDirectory, // Deno.cwd()/.github (default)
    dotEnvPath, // Deno.cwd()/.env (default)
    noGitHub,
    noDotEnv,
    pathToConfig,
    pathToTerraformBinary,
    pathToKubernetesManifests,
    pathToCNDIBinary,
    pathToTerraformResources,
    fileSuffixForPlatform,
    pathToOpenSSL,
    pathToKeys,
    pathToKubeseal,
    interactive,
    noKeys,
    gitignorePath,
  };

  // map command to function
  const commands = {
    [Command.init]: initFn,
    [Command["overwrite-with"]]: overwriteWithFn,
    [Command.ow]: overwriteWithFn,
    [Command.run]: runFn,
    [Command.help]: helpFn,
    [Command.install]: installFn,
    [Command.terraform]: terraformFn,
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
          cndiLabel,
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
      case Command.terraform:
        commands[Command.terraform](context, args.slice(1));
        break;
      default:
        commands[Command.default](operation);
        break;
    }
  }
}
