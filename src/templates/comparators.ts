import { CNDITemplatePromptResponsePrimitive } from "./templates.ts";

const CNDITemplateComparators = {
  // comparators are generous with type coercion for better or worse
  "==": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: string | number | boolean,
  ) => response == standard,
  "!=": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: string | number | boolean,
  ) => response != standard,
  ">": (response: CNDITemplatePromptResponsePrimitive, standard: number) => {
    if (typeof response === "number") {
      return response > standard;
    }
    throw new Error("cannot compare non-number to number");
  },
  "<": (response: CNDITemplatePromptResponsePrimitive, standard: number) => {
    if (typeof response === "number") {
      return response < standard;
    }
    throw new Error("cannot compare non-number to number");
  },
  "<=": (response: CNDITemplatePromptResponsePrimitive, standard: number) => {
    if (typeof response === "number") {
      return response <= standard;
    }
    throw new Error("cannot compare non-number to number");
  },
  ">=": (response: CNDITemplatePromptResponsePrimitive, standard: number) => {
    if (typeof response === "number") {
      return response >= standard;
    }
    throw new Error("cannot compare non-number to number");
  },
} as const;

export default CNDITemplateComparators;
