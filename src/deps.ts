// Deno std lib
import * as yaml from "@std/yaml";
export * as path from "@std/path";
export * as JSONC from "@std/jsonc";
export { deepMerge } from "@std/collections";
export { delay } from "@std/async";
export { ensureDirSync, exists, existsSync, walk, walkSync } from "@std/fs";
export { load as loadEnv, loadSync as loadEnvSync } from "@std/dotenv";
export { writeAll } from "@std/io";
export { Spinner, type SpinnerOptions } from "@std/cli";

// node std lib
export { homedir, platform } from "node:os";
export { unzip } from "node:zlib";
export { promisify } from "node:util";

export const YAML = {
  ...yaml,
  // deno-lint-ignore no-explicit-any
  stringify: (obj: any, opt = {}) =>
    yaml.stringify(obj, { lineWidth: -1, ...opt }), // prevent auto line wrap
};

// Third party
//  - cliffy
export { Command, CompletionsCommand, HelpCommand } from "@cliffy/command";

import { colors } from "@cliffy/ansi";

import {
  Checkbox,
  Confirm,
  Input,
  List,
  Number,
  prompt,
  Secret,
  Select,
  Toggle,
} from "@cliffy/prompt";

export { prompt as cprompt };

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
export { default as validator } from "validator";

// - lodash
export { default as getValueFromKeyPath } from "lodash.get";
export { default as setValueForKeyPath } from "lodash.set";
export { default as unsetValueForKeyPath } from "lodash.unset";

//  - simple-git
export { simpleGit } from "simple-git";

//  - crypto-js
import CryptoJS from "crypto-js";

// import/export required
export { CryptoJS };

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

// Polyseam Modules
export * as silky from "@polyseam/silky";
export { inflateResponse } from "@polyseam/inflate-response";

export {
  GHRError,
  GithubReleasesProvider,
  GithubReleasesUpgradeCommand,
} from "@polyseam/cliffy-provider-gh-releases";
