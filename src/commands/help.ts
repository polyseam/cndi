import { helpStrings } from "../doc/help-strings.ts";
import { Command } from "../types.ts";
/**
 * COMMAND fn: cndi help
 * Warns user that "help" is not a command
 * we use --help instead
 */
export default function helpFn(command: Command) {
  const content = helpStrings?.[command];
  if (content) {
    console.log(content);
  } else {
    console.error(
      `Command "${command}" not found. Use "cndi --help" for more information.`,
    );
  }
}
