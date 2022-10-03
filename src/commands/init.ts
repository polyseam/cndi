import { CNDIContext } from "../types.ts";
import overwriteWithFn from "./overwrite-with.ts";
/**
 * COMMAND fn: cndi init
 * Initializes ./cndi directory with the specified config file
 * and initializes workflows in .github
 */
export default function init(context: CNDIContext) {
  console.log(`cndi init -f "${context.pathToConfig}"`);
  const initializing = true;
  overwriteWithFn(context, initializing);
}
