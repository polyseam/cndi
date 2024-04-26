import { PromptTypes } from "deps";

export type CNDITemplatePromptResponsePrimitive =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<boolean>;

export type PromptType = keyof typeof PromptTypes;
export type Result<T> = { value: T; error?: never } | {
  error: Error;
  value?: never;
};
