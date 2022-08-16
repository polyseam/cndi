import * as JSONC from "https://deno.land/std@0.152.0/encoding/jsonc.ts";
import * as flags from "https://deno.land/std@0.152.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.152.0/path/mod.ts";
import * as process from "https://deno.land/std@0.152.0/node/process.ts";
import { helpStrings } from "./docs/cli/help-strings.ts";

// const DEFAULT_CNDI_CONFIG_PATH = path.join(Deno.cwd(), "cndi-config.json");
// const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`;

const enum Command {
  default = "default",
  init = "init",
  "overwrite-with" = "overwriteWith",
  run = "run",
  help = "help",
}

const cndiArguments = flags.parse(Deno.args);

// const pathToConfig =
//   cndiArguments.f ||
//   cndiArguments.file ||
//   DEFAULT_CNDI_CONFIG_PATH_JSONC ||
//   DEFAULT_CNDI_CONFIG_PATH;

if (cndiArguments.help || cndiArguments.h) {
  const key =
    typeof cndiArguments.help === "boolean" ? "default" : cndiArguments.help;
  help(key);
} else if (cndiArguments["_"].includes("help")) {
  help(Command.help);
}

//let config;

// try {
//   config = JSONC.parse(Deno.readTextFileSync(pathToConfig));
// } catch (readFileError) {
//   console.dir(readFileError);
//   process.exit(1);
// }

function help(command: Command) {
  const content = helpStrings?.[command];
  if (content) {
    console.log(content);
  } else {
    console.error(
      `Command "${command}" not found. Use "cndi help" for more information.`
    );
  }
}

// function init(config) {
//   console.log("cndi init");
// }

// function overwriteWith(config) {
//   console.log("cndi overwrite-with");
// }

// function run() {
//   console.log("cndi run");
// }

// console.log(config);
