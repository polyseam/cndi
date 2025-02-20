// npm: validator
import { default as validator } from "validator";

type PromptType =
  | "Input"
  | "Secret"
  | "Confirm"
  | "Toggle"
  | "Select"
  | "List"
  | "Checkbox"
  | "Number"
  | "File";

export type CNDITemplatePromptResponsePrimitive =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<boolean>;

type CNDIValidatorInput = {
  value: CNDITemplatePromptResponsePrimitive;
  type: PromptType;
  arg?: unknown;
};

type CNDIInvalidReason = string;

type CNDIValidator = (input: CNDIValidatorInput) => CNDIInvalidReason | null;

function redact(s: string): string {
  return "*".repeat(s.length);
}

function isSlug(input: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(input);
}

// each validator returns an error message or null
export const BuiltInValidators: Record<string, CNDIValidator> = {
  is_slug: ({ value, type }: CNDIValidatorInput) => {
    if (isSlug(value as string)) {
      return null;
    }
    let val = value;
    if (type === "Secret") {
      val = redact(value as string);
    }
    return `'${val}' is not a valid slug, must be lowercase and contain only letters, numbers, and hyphens`;
  },
  email: ({ value, type }: CNDIValidatorInput) => {
    if (validator.isEmail(value as string)) {
      return null;
    }
    let val = value;
    if (type === "Secret") {
      val = redact(value as string);
    }
    return `'${val}' is not a valid email address`;
  },
  hostname: ({ value, type }: CNDIValidatorInput) => {
    if (validator.isFQDN(value as string)) {
      return null;
    }
    let val = value;
    if (type === "Secret") {
      val = redact(value as string);
    }
    return `'${val}' is not a valid hostname`;
  },
  url: ({ value, type }: CNDIValidatorInput) => {
    if (validator.isURL(value as string)) {
      return null;
    }
    let val = value;
    if (type === "Secret") {
      val = redact(value as string);
    }
    return `'${val}' is not a valid URL`;
  },
  max_length: ({ value, arg }: CNDIValidatorInput) => {
    const len = arg as number;
    if ((value as string).length <= len) {
      return null;
    }

    return `must be at most ${len} characters long`;
  },
  min_length: ({ value, type, arg }: CNDIValidatorInput) => {
    const len = arg as number;
    if ((value as string).length >= len) {
      return null;
    }
    let val = value;
    if (type === "Secret") {
      val = redact(value as string);
    }
    return `'${val}' is not at least ${len} characters long`;
  },
  is_json: ({ value, type }: CNDIValidatorInput) => {
    try {
      JSON.parse(value as string);
      return null;
    } catch (_parseError) {
      let val = value;
      if (type === "Secret") {
        val = redact(value as string);
      }
      return `'${val}' is not valid JSON`;
    }
  },
} as const;
