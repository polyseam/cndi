import { BuiltInValidators } from "shared-modules/prompt-validators.ts";

import {
  type CNDIPromptSpec,
  type CNDITemplatePromptResponsePrimitive,
} from "islands/Configurator/shared.ts";

export type ValidationError = {
  message: string;
  validator: string;
};

export const validateFields = (
  value: CNDITemplatePromptResponsePrimitive,
  { validators, type }: CNDIPromptSpec,
): { message: string; validator: string }[] => {
  const errs: { message: string; validator: string }[] = [];

  validators?.map((
    vSpec: string | Record<string, CNDITemplatePromptResponsePrimitive>,
  ) => {
    const vName = typeof vSpec == "string" ? vSpec : Object.keys(vSpec)?.[0];
    const vSpecArg = vSpec?.[vName as keyof typeof vSpec];

    console.log(
      "validating",
      value,
      "against",
      vName,
      vSpecArg ? `with arg ${vSpecArg}` : "",
    );

    const message = BuiltInValidators[vName as string]({
      arg: vSpecArg,
      value,
      type,
    });

    if (message) {
      errs.push({ message, validator: vName });
    }
  });
  return errs;
};
