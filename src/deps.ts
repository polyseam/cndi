// Deno std lib
export { homedir, platform } from "node:os";
export { copy } from "https://deno.land/std@0.201.0/streams/copy.ts";
export { SEP } from "https://deno.land/std@0.201.0/path/mod.ts";
export * as path from "https://deno.land/std@0.201.0/path/mod.ts";
import * as yaml from "https://deno.land/std@0.196.0/yaml/mod.ts";
export { deepMerge } from "https://deno.land/std@0.201.0/collections/deep_merge.ts";
export { walk } from "https://deno.land/std@0.201.0/fs/mod.ts";
export * as JSONC from "https://deno.land/std@0.201.0/jsonc/mod.ts";
export { delay } from "https://deno.land/std@0.201.0/async/delay.ts";
export { exists } from "https://deno.land/std@0.201.0/fs/mod.ts";
export { existsSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
export { load as loadEnv } from "https://deno.land/std@0.205.0/dotenv/mod.ts";

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
} from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

export { GithubProvider } from "https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts";

import { UpgradeOptions } from "https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

import {
  Checkbox,
  Confirm,
  Input,
  List,
  Number,
  Secret,
  Select,
  Toggle,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";

export { prompt } from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";

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

// spinners
export {
  default as TerminalSpinner,
  Spinners,
} from "https://deno.land/x/kia@0.4.1/mod.ts";

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

export { Construct } from "npm:constructs";
export {
  App,
  Fn,
  LocalBackend,
  TerraformLocal,
  TerraformOutput,
  TerraformStack,
  TerraformVariable,
} from "npm:cdktf";

// Terraform CDKTF Providers
export * as CDKTFProviderRandom from "npm:@cdktf/provider-random";
export * as CDKTFProviderAWS from "npm:@cdktf/provider-aws";
export * as CDKTFProviderAzure from "npm:@cdktf/provider-azurerm";
export * as CDKTFProviderGCP from "npm:@cdktf/provider-google";
export * as CDKTFProviderHelm from "npm:@cdktf/provider-helm";
export * as CDKTFProviderKubernetes from "npm:@cdktf/provider-kubernetes";
export * as CDKTFProviderTime from "npm:@cdktf/provider-time";
export * as CDKTFProviderTls from "npm:@cdktf/provider-tls";
