import { validator } from "deps";
import {
  CNDITemplatePromptResponsePrimitive,
  PromptType,
} from "./templates.ts";

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

export const BuiltInValidators: Record<string, CNDIValidator> = {
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
