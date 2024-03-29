// Deno std lib
export { homedir, platform } from "node:os";
export { SEPARATOR } from "@std/path/constants";
export * as path from "@std/path";
import * as yaml from "@std/yaml";
export { deepMerge } from "@std/collections";
export { walk } from "@std/fs";
export * as JSONC from "@std/jsonc";
export { delay } from "@std/async";
export { exists } from "@std/fs";
export { ensureDirSync } from "@std/fs";
export { existsSync } from "@std/fs";
export { load as loadEnv } from "@std/dotenv";
export { walkSync } from "@std/fs";
export { writeAll } from "@std/io";

export { Spinner } from "@std/cli";
export { type SpinnerOptions } from "@std/cli";
export { unzip } from "node:zlib";
export { promisify } from "node:util";

// Polyseam Modules
export * as silky from "@polyseam/silky";
export { inflateResponse } from "@polyseam/inflate-response";

export const YAML = {
  ...yaml,
  // deno-lint-ignore no-explicit-any
  stringify: (obj: any, opt = {}) =>
    yaml.stringify(obj, { lineWidth: -1, ...opt }), // prevent auto line wrap
};

// Third party
//  - cliffy
export {
  Command,
  CompletionsCommand,
  HelpCommand,
  UpgradeCommand,
<<<<<<< HEAD
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

export { GithubProvider } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/upgrade/mod.ts";

import { UpgradeOptions } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/upgrade/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts";
=======
} from "@cliffy/cliffy/command/mod.ts";

export { GithubProvider } from "@cliffy/cliffy/command/upgrade/mod.ts";
import { UpgradeOptions } from "@cliffy/cliffy/command/upgrade/mod.ts";
import { colors } from "@cliffy/cliffy/ansi/colors.ts";
>>>>>>> 3c8c2450988f8ca94b4a608df2cc21080d35d813

import {
  Checkbox,
  Confirm,
  Input,
  List,
  Number,
  Secret,
  Select,
  Toggle,
<<<<<<< HEAD
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";

export { prompt as cprompt } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
=======
} from "@cliffy/cliffy/prompt/mod.ts";

export { prompt as cprompt } from "@cliffy/cliffy/prompt/mod.ts";
>>>>>>> 3c8c2450988f8ca94b4a608df2cc21080d35d813

// used to have keys, should not matter
export const PromptTypes = {
  Input,
  Secret,
  Confirm,
  Toggle,
  Select,
  List,
  Checkbox,
  Number,
  File: Input,
} as const;

//  - validator
export { default as validator } from "npm:validator";

// - lodash
export { default as getValueFromKeyPath } from "npm:lodash.get@4.4.2";
export { default as setValueForKeyPath } from "npm:lodash.set@4.3.2";
export { default as unsetValueForKeyPath } from "npm:lodash.unset@4.5.2";

//  - simple-git
export { simpleGit } from "npm:simple-git@3.18.0";

//  - crypto-js
import CryptoJS from "npm:crypto-js@4.1.1";

// import/export required
export { CryptoJS };
export type { UpgradeOptions };

// custom colors
export const ccolors = {
  faded: colors.white,
  user_input: colors.brightWhite,
  warn: colors.yellow,
  error: colors.brightRed,
  prompt: colors.cyan,
  success: colors.green,
  key_name: colors.cyan,
  caught: (e: Error, num?: number) => {
    const errCode = num ? `E${num}` : `E`;
    return `${colors.white(errCode)}: ${colors.red(e.toString())}`;
  },
};
