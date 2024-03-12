import { CNDITemplatePromptResponsePrimitive } from "../types.ts";

export function unwrapQuotes(input: string): string {
  if (input.startsWith('"') && input.endsWith('"')) {
    return input.slice(1, -1);
  }
  if (input.startsWith("'") && input.endsWith("'")) {
    return input.slice(1, -1);
  }
  return input;
}

export function processBlockBodyArgs(
  blk: string,
  args?: Record<string, CNDITemplatePromptResponsePrimitive>,
): string {
  if (!args) return blk;

  for (const key in args) {
    if (blk.indexOf(`{{$cndi.get_arg(${key})}}`) > -1) {
      const val = args[key];
      blk = blk.replaceAll(`{{$cndi.get_arg(${key})}}`, `${val}`);
    }
  }
  return blk;
}

export function removeWhitespaceBetweenBraces(input: string): string {
  // This regular expression matches all instances of text that start with "{{", end with "}}",
  // and captures all characters including whitespace in between.
  // The \s* inside the capturing group ([^\{\}]*?) ensures we target whitespaces as well,
  // but without removing the critical characters that define our target blocks.
  return input.replace(/\{\{([\s\S]*?)\}\}/g, (match) => {
    // Remove all whitespace characters from the matched text and then wrap it back with "{{" and "}}"
    return `{{${match.slice(2, -2).replace(/\s+/g, "")}}}`;
  });
}
