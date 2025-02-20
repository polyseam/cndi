import { ConfiguratorGizmoContext } from "./ConfiguratorGizmoContext.tsx";
import { CNDITemplateObject } from "islands/Configurator/shared.ts";
import { ComponentChildren } from "preact";

export type ConfiguratorGizmoProviderProps = {
  templateObjectSource?: CNDITemplateObject;
  templateIdentifier: string;
  children: ComponentChildren;
};

export function ConfiguratorGizmoProvider(
  props: ConfiguratorGizmoProviderProps,
) {
  const { templateIdentifier, children } = props;

  const templateObjectSource = props.templateObjectSource as CNDITemplateObject;

  const contextValue = {
    templateObjectSource,
    templateIdentifier,
  };

  return (
    <ConfiguratorGizmoContext.Provider value={contextValue}>
      {children}
    </ConfiguratorGizmoContext.Provider>
  );
}
