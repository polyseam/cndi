import { CNDITemplatePromptResponsePrimitive } from "./templates.ts";

const CNDITemplateComparators = {
  // comparators are generous with type coercion for better or worse
  "==": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => response == standard,
  "!=": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => response != standard,
  ">": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => {
    if (typeof standard !== "number") {
      throw new Error("'>' can be used in comparisons only");
    }
    if (typeof response === "number") {
      return response > standard;
    }
    throw new Error("cannot compare non-number to number");
  },
  "<": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => {
    if (typeof standard !== "number") {
      throw new Error("'<' can be used in comparisons only");
    }
    if (typeof response === "number") {
      return response < standard;
    }
    throw new Error("cannot compare non-number to number");
  },
  "<=": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => {
    if (typeof standard !== "number") {
      throw new Error("'<=' can be used in comparisons only");
    }
    if (typeof response === "number") {
      return response <= standard;
    }
    throw new Error("cannot compare non-number to number");
  },
  ">=": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => {
    if (typeof standard !== "number") {
      throw new Error("'>=' can be used in comparisons only");
    }
    if (typeof response === "number") {
      return response >= standard;
    }
    throw new Error("cannot compare non-number to number");
  },
} as const;

export default CNDITemplateComparators;
