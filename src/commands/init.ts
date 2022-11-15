import { CNDIContext } from "../types.ts";
import { copy } from "https://deno.land/std@0.157.0/fs/copy.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import overwriteWithFn from "./overwrite-with.ts";
/**
 * COMMAND fn: cndi init
 * Initializes ./cndi directory with the specified config file
 * and initializes workflows in .github
 */
export default async function init(context: CNDIContext) {
  const initializing = true;
  const { template, pathToConfig, CNDI_SRC } = context;
  if (template) {
    console.log(`cndi init --template ${template}`);
    // if the user has specified a template, use that
    try {
      await copy(
        path.join(CNDI_SRC, "templates", `${template}.jsonc`),
        pathToConfig,
        {
          overwrite: true,
        },
      );
    } catch (errorCopyingTemplate) {
      throw new Error(
        `Error copying template "${template}" to "${pathToConfig}": ${errorCopyingTemplate}`,
      );
    }
  } else {
    console.log(`cndi init -f "${pathToConfig}"`);
  }
  overwriteWithFn(context, initializing);
}
