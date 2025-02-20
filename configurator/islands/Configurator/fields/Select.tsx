import { useEffect } from "preact/hooks";
import {
  ConfiguratorPromptFieldLabel,
  type ConfiguratorPromptFieldProps,
  deriveInputAttribute,
} from "islands/Configurator/ConfiguratorPromptField.tsx";

import {
  CNDIPromptSpec,
  CNDITemplatePromptResponsePrimitive,
} from "islands/Configurator/shared.ts";

const defaultValueForSpec = (pSpec: CNDIPromptSpec) => {
  if (pSpec.default) {
    return `${pSpec.default}`;
  }
  const [first] = pSpec?.options as CNDITemplatePromptResponsePrimitive[];
  if (!first) {
    console.error("Select prompt has no default value and no options!");
    return "";
  }
  return `${first}`;
};

export const Select = (props: ConfiguratorPromptFieldProps) => {
  const { spec, onChange } = props;
  const { name, message } = spec;
  const defaultValue = defaultValueForSpec(spec);
  const multiple = spec.type === "Checkbox";

  useEffect(() => {
    onChange(name, defaultValue);
    return () => {
      onChange(name, "");
    };
  }, []);

  // git_credentials_mode='token' is the only valid value to pass into `cndi create`
  // TODO: support git_credentials_mode='ssh' in the `cndi create` CLI
  if (name === "git_credentials_mode") return null;

  return (
    <ConfiguratorPromptFieldLabel message={message}>
      <select
        id={name}
        name={name}
        class="p-2 m-2 rounded text-gray-200 placeholder:text-gray-400 bg-darkpurp border-r-8 border-transparent text-lg font-mono"
        onChange={(e) => {
          onChange(e.currentTarget.name, e.currentTarget.value);
        }}
        placeholder={name}
        defaultValue={defaultValue}
        multiple={multiple}
      >
        {spec?.options?.map((o) => (
          <option value={deriveInputAttribute(o)}>{o}</option>
        ))}
      </select>
    </ConfiguratorPromptFieldLabel>
  );
};
