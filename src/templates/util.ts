import { CNDITemplatePromptResponsePrimitive } from "./templates.ts";

/**
 * Gets all keys in an object recursively
 * @param obj
 * @returns array of all dot-delimitted key paths in object
 */
function getObjectKeysRecursively<T extends object>(obj: T): string[] {
  const keys: string[] = [];

  // deno-lint-ignore no-explicit-any
  function recurse(currObj: any, prefix = "") {
    for (const key in currObj) {
      if (Object.hasOwn(currObj, key)) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        keys.push(newPrefix);
        if (typeof currObj[key] === "object" && currObj[key] !== null) {
          recurse(currObj[key], newPrefix);
        }
      }
    }
  }

  recurse(obj);
  return keys;
}

/**
 * Checks if a string is a valid URL
 * @param maybeUrl string which may or may not be a URL
 * @returns true if string is a valid URL
 */
function isValidUrl(maybeUrl: string): boolean {
  let url;

  try {
    url = new URL(maybeUrl);
  } catch (_) {
    return false;
  }
  return (
    url.protocol === "http:" ||
    url.protocol === "https:" ||
    url.protocol === "file:"
  );
}

/**
 * Gets the "home" directory for window or unix systems
 * @returns path to home directory
 */
function homedir(): string | undefined {
  return Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
}

/**
 * Replaces a range in a string with a substituted value
 * @param s string which should be modified
 * @param start index of the first character to be replaced
 * @param end index of the last character to be replaced
 * @param substitute
 * @returns new string after substitution
 */
function replaceRange(
  s: string,
  start: number,
  end: number,
  substitute: CNDITemplatePromptResponsePrimitive,
) {
  return s.substring(0, start) + substitute + s.substring(end);
}
/**
 * returns a new string with wrapping quotes removed
 * @param s string that may have quotes to remove
 * @returns string with wrapping quotes removed
 */
function unwrapQuotes(s: string): string {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.substring(1, s.length - 1);
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.substring(1, s.length - 1);
  }
  return s;
}

function characterAtPositionIsQuote(str: string, pos: number): boolean {
  return str.charAt(pos) === '"' || str.charAt(pos) === "'";
}

export {
  characterAtPositionIsQuote,
  getObjectKeysRecursively,
  homedir,
  isValidUrl,
  replaceRange,
  unwrapQuotes,
};
