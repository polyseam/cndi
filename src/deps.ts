// Deno std lib
export { homedir, platform } from "node:os";
export { copy } from "https://deno.land/std@0.196.0/streams/copy.ts";
export { SEP } from "https://deno.land/std@0.196.0/path/mod.ts";
export * as path from "https://deno.land/std@0.196.0/path/mod.ts";
export * as YAML from "https://deno.land/std@0.196.0/yaml/mod.ts";
export { deepMerge } from "https://deno.land/std@0.196.0/collections/deep_merge.ts";
export { walk } from "https://deno.land/std@0.196.0/fs/mod.ts";
export * as JSONC from "https://deno.land/std@0.196.0/jsonc/mod.ts";
export { delay } from "https://deno.land/std@0.196.0/async/delay.ts";
export { exists } from "https://deno.land/std@0.196.0/fs/mod.ts";
export { existsSync } from "https://deno.land/std@0.196.0/fs/mod.ts";

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
export { simpleGit } from "npm:simple-git@3.18.0";

//  - crypto-js
import CryptoJS from "npm:crypto-js@4.1.1";

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
