// Deno std lib

export { copy } from "https://deno.land/std@0.180.0/streams/copy.ts";
export { SEP } from "https://deno.land/std@0.180.0/path/mod.ts";
export { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
export * as path from "https://deno.land/std@0.180.0/path/mod.ts";
export { stringify } from "https://deno.land/std@0.180.0/encoding/yaml.ts";
export { deepMerge } from "https://deno.land/std@0.180.0/collections/deep_merge.ts";
export { platform } from "https://deno.land/std@0.173.0/node/os.ts";
export { walk } from "https://deno.land/std@0.180.0/fs/mod.ts";
export * as JSONC from "https://deno.land/std@0.180.0/encoding/jsonc.ts";
export { delay } from "https://deno.land/std@0.180.0/async/delay.ts";
//  - testing
export {
  afterAll,
  beforeAll,
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
export { simpleGit } from "src/lib/simple-git.js";

//  - crypto-js
import CryptoJS from "src/lib/crypto-js.js";

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
  caught: (e: Error, num?: number) => {
    const errCode = num ? `E${num}` : `E`;
    return `${colors.white(errCode)}: ${colors.red(e.toString())}`;
  },
};

// constants
export const TERRAFORM_VERSION = "1.4.6";
export const KUBESEAL_VERSION = "0.19.1";

export const DEFAULT_INSTANCE_TYPES = {
  aws: "m5a.large" as const,
  gcp: "n2-standard-2" as const,
  azure: "Standard_D4s_v3" as const,
};

export const DEFAULT_NODE_DISK_SIZE = 100;

export const NODE_DISK_SIZE_KEY = {
  aws: "volume_size" as const,
  gcp: "size" as const,
  azure: "disk_size_gb" as const,
};

export const nonMicrok8sNodeKinds = ["eks"];
