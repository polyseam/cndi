// Deno std lib

export { copy } from "https://deno.land/std@0.180.0/streams/copy.ts";
export { SEP } from "https://deno.land/std@0.180.0/path/mod.ts";
export { writableStreamFromWriter } from "https://deno.land/std@0.180.0/streams/writable_stream_from_writer.ts";
export { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
export * as path from "https://deno.land/std@0.180.0/path/mod.ts";
export { stringify } from "https://deno.land/std@0.180.0/encoding/yaml.ts";
export { deepMerge } from "https://deno.land/std@0.180.0/collections/deep_merge.ts";
export { platform } from "https://deno.land/std@0.173.0/node/os.ts";
export { walk } from "https://deno.land/std@0.180.0/fs/mod.ts";
export * as JSONC from "https://deno.land/std@0.180.0/encoding/jsonc.ts";

//  - testing
export {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.180.0/testing/bdd.ts";
export { assert } from "https://deno.land/std@0.180.0/testing/asserts.ts";

// Third party
//  - cliffy
export {
  Command,
  CompletionsCommand,
  HelpCommand,
  UpgradeCommand,
} from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

export {
  GithubProvider,
} from "https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts";

import { UpgradeOptions } from "https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

export {
  Checkbox,
  Confirm,
  Input,
  List,
  Number,
  prompt,
  Secret,
  Select,
  Toggle,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";

//  - simple-git
export { simpleGit } from "https://esm.sh/v103/simple-git@3.15.1?no-dts&target=deno&deno-std=0.173.0&bundle&deps=@kwsites/file-exists@1.1.1";

//  - crypto-js
import CryptoJS from "https://esm.sh/v103/crypto-js@4.1.1?bundle";

//  - spinners

export {
  SpinnerTypes,
  TerminalSpinner,
} from "https://deno.land/x/spinners@v1.1.2/mod.ts";

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
  caught: colors.red,
};

// constants
export const TERRAFORM_VERSION = "1.3.2";
export const KUBESEAL_VERSION = "0.19.1";
