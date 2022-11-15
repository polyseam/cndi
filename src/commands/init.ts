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
  const CNDI_CONFIG_FILENAME = "cndi-config.jsonc";

  const { template, projectDirectory, CNDI_SRC } = context;

  // if the user has specified a template, use that
  if (template) {
    console.log(`cndi init --template ${template}`);

    const configOutputPath = path.join(projectDirectory, CNDI_CONFIG_FILENAME);
    const templatePath = path.join(CNDI_SRC, "templates", `${template}.jsonc`);

    // if the template doesn't exist, throw an error
    try {
      await Deno.stat(templatePath);
    } catch (_templateNotFoundError) {
      throw new Error(
        `No such template: "${template}". Please check the template name and try again.`,
      );
    }

    try {
      await copy(templatePath, configOutputPath, {
        overwrite: true,
      });
    } catch (_errorCopyingTemplate) {
      // if the template does exist but it can't be copied to a projectDirectory, throw an error
      throw new Error(
        `Error copying template: "${template}" to "${configOutputPath}".\n Please check the destination path and try again.`,
      );
    }

    // because there is no "pathToConfig" when using a template, we need to set it here
    overwriteWithFn(
      { ...context, pathToConfig: configOutputPath },
      initializing,
    );

    return;
  } else {
    console.log(`cndi init -f "${context.pathToConfig}"`);
  }

  overwriteWithFn(context, initializing);
}
