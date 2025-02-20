import {
  CNDIState,
  CNDITemplatePromptResponsePrimitive,
} from "islands/Configurator/shared.ts";
import { processMacrosInValue } from "islands/Configurator/macros.ts";

type CNDITemplateConditionComparator = "==" | "!=" | ">" | "<" | ">=" | "<=";

export type CNDITemplateConditonSpec = [
  CNDITemplatePromptResponsePrimitive,
  CNDITemplateConditionComparator,
  CNDITemplatePromptResponsePrimitive,
];

export const CNDITemplateComparators = {
  // comparators are generous with type coercion for better or worse
  "==": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => (
    `${response}` == `${standard}`
  ),
  "!=": (
    response: CNDITemplatePromptResponsePrimitive,
    standard: CNDITemplatePromptResponsePrimitive,
  ) => `${response}` != `${standard}`,
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

export async function evaluateCNDITemplateCondition(
  cSpec: CNDITemplateConditonSpec,
  $cndi: CNDIState,
) {
  const [lSpec, comparator, rSpec] = cSpec;

  const left =
    (typeof lSpec === "string"
      ? await processMacrosInValue(lSpec, $cndi)
      : lSpec) as CNDITemplatePromptResponsePrimitive;

  const right =
    (typeof rSpec === "string"
      ? await processMacrosInValue(rSpec, $cndi)
      : rSpec) as CNDITemplatePromptResponsePrimitive;

  const result = CNDITemplateComparators[comparator](left, right);
  return result;
}
