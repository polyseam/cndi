import { useEffect } from "preact/hooks";
import {
  ConfiguratorPromptFieldLabel,
  type ConfiguratorPromptFieldProps,
} from "islands/Configurator/ConfiguratorPromptField.tsx";

export const Confirm = (props: ConfiguratorPromptFieldProps) => {
  const { spec, onChange } = props;
  const { name, message } = spec;
  const defaultChecked = !!spec.default;
  useEffect(() => {
    onChange(name, defaultChecked);
    return () => {
      onChange(name, "");
    };
  }, []);
  return (
    <ConfiguratorPromptFieldLabel message={message}>
      <input
        class="peer sr-only p-2 m-2 text-gray-200 rounded placeholder:text-gray-900 bg-gray-700"
        type="checkbox"
        id={name}
        name={name}
        defaultChecked={defaultChecked}
        onInput={(e) => {
          onChange(e.currentTarget.name, e.currentTarget.checked);
        }}
      />
      <div class="m-2 p-2 relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:[#180f1e]  dark:peer-focus:[#180f1e] dark:bg-darkpurp peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#7c6991] dark:peer-checked:bg-[#7c6991]">
      </div>
    </ConfiguratorPromptFieldLabel>
  );
};
