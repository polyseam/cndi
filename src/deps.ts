// Deno std lib
import * as yaml from "@std/yaml";
export * as path from "@std/path";
export * as JSONC from "@std/jsonc";
export { deepMerge } from "@std/collections";
export {
  copy,
  ensureDirSync,
  exists,
  existsSync,
  walk,
  walkSync,
} from "@std/fs";
export { load as loadEnv, loadSync as loadEnvSync } from "@std/dotenv";
export { writeAll } from "@std/io";
export { Spinner, type SpinnerOptions } from "@std/cli/unstable-spinner";

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
export { Command } from "@cliffy/command";
export { CompletionsCommand } from "@cliffy/command/completions";
import { EnumType } from "@cliffy/command";

export const WorkflowType = new EnumType(["run", "check"]);

import { colors } from "@cliffy/ansi/colors";

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
  ValidateResult,
} from "@cliffy/prompt";

export type { ValidateResult };

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
import * as validator from "validator";
export { validator };

// - lodash
export { default as getValueFromKeyPath } from "lodash.get";
export { default as setValueForKeyPath } from "lodash.set";
export { default as unsetValueForKeyPath } from "lodash.unset";

//  - simple-git
export { simpleGit } from "simple-git";

import CryptoJS from "crypto-js";
export { CryptoJS };

// custom colors
export const ccolors = {
  faded: colors.gray,
  user_input: colors.brightWhite,
  warn: colors.yellow,
  error: colors.brightRed,
  prompt: colors.cyan,
  success: colors.green,
  key_name: colors.cyan,
  key_path: colors.blue,
  caught: (e: Error, num?: number) => {
    const errCode = num ? `E${num}` : `E`;
    return `${colors.white(errCode)}: ${colors.red(e.toString())}`;
  },
};

// Polyseam Modules

export {
  KNOWN_TEMPLATES,
  POLYSEAM_TEMPLATE_DIRECTORY_URL,
} from "@cndi/known-templates";

export { CNDIValidators } from "@cndi/validators";

export * as silky from "@polyseam/silky";

export {
  GHRError,
  GithubReleasesProvider,
  GithubReleasesUpgradeCommand,
} from "@polyseam/cliffy-provider-gh-releases";
