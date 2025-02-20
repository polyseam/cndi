import { CNDITemplatePromptResponsePrimitive } from "islands/Configurator/shared.ts";
import { ValidationError } from "islands/Configurator/responseValidators.ts";
import { CNDIPromptSpec } from "islands/Configurator/shared.ts";
import { ComponentChildren } from "preact";
import { Input } from "islands/Configurator/fields/Input.tsx";
import { Confirm } from "islands/Configurator/fields/Confirm.tsx";
import { Select } from "islands/Configurator/fields/Select.tsx";
import { File } from "islands/Configurator/fields/File.tsx";

export type UpdatePromptResponse = (
  responseName: string,
  newResponseValue: CNDITemplatePromptResponsePrimitive,
) => void;

export type ConfiguratorPromptFieldProps = {
  spec: CNDIPromptSpec;
  onChange: UpdatePromptResponse;
};

type ConfiguratorPromptFieldLabelProps = {
  message: string;
  children: ComponentChildren;
};

export const ConfiguratorPromptFieldLabel = ({
  message,
  children,
}: ConfiguratorPromptFieldLabelProps) => {
  return (
    <label class="grid grid-cols-1 mb-2 text-lg text-purple-200">
      <span class="mx-2">{message}</span>
      {children}
    </label>
  );
};

export const deriveInputAttribute = (v?: CNDITemplatePromptResponsePrimitive) =>
  `${v}` === "undefined" ? "" : `${v}`;

type ConfiguratorPromptFieldErrorProps = {
  responseName: string;
  errors: Array<ValidationError>;
};

export const ConfiguratorPromptFieldError = ({
  errors,
  responseName,
}: ConfiguratorPromptFieldErrorProps) => {
  if (errors.length === 0) return null;
  const [{ message }] = errors;
  return (
    <div class="mx-2 text-red-500">
      <span class="font-mono text-xs">{responseName}</span>
      <span class="text-xs text-red-400">{message}</span>
    </div>
  );
};

export const ConfiguratorPromptField = ({
  spec,
  onChange,
}: ConfiguratorPromptFieldProps) => {
  switch (spec.type) {
    case "Input": // type="text"
    case "Secret": // type="password"
    case "Number": // type="number"
    case "List": // comma separated
      return <Input spec={spec} onChange={onChange} />;
    case "Confirm": // on/off switch
      return <Confirm spec={spec} onChange={onChange} />;
    case "Checkbox": // multiple select
    case "Select": // single select
      return <Select spec={spec} onChange={onChange} />;
    case "File": // file upload
      return <File spec={spec} onChange={onChange} />;
  }
};
