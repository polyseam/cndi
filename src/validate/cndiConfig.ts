import { ccolors } from "deps";
import { CNDIConfig } from "src/types.ts";

const cndiConfigLabel = ccolors.faded("\nsrc/validate/cndiConfig.ts:");

export default function validateConfig(
  config: CNDIConfig,
  pathToConfig: string,
) {
  if (!config) {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file not found at "),
        ccolors.user_input(`"${pathToConfig}"`),
      ].join(" "),
      { cause: 500 },
    );
  }

  if (config?.cndi_version && config?.cndi_version !== "v2") {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it has an unsupported"),
        ccolors.key_name('"cndi_version"'),
        ccolors.error("value. Only"),
        ccolors.key_name("v2"),
        ccolors.error("is supported."),
      ].join(" "),
      { cause: 4500 },
    );
  }

  if (!config?.project_name) {
    console.log();
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"project_name"'),
        ccolors.error("key"),
      ].join(" "),
      { cause: 900 },
    );
  }

  if (!config?.infrastructure) {
    console.log();
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"infrastructure"'),
        ccolors.error("key"),
      ].join(" "),
      { cause: 901 },
    );
  }

  const open_ports = config?.infrastructure?.cndi?.open_ports;

  if (open_ports) {
    if (Array.isArray(open_ports)) {
      let index = 0;
      for (const port of open_ports) {
        if (!port.number) {
          throw new Error(
            [
              cndiConfigLabel,
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"number"'),
              ccolors.error("key"),
            ].join(" "),
            { cause: 912 },
          );
        }
        if (!port.name) {
          throw new Error(
            [
              cndiConfigLabel,
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"name"'),
              ccolors.error("key"),
            ].join(" "),
            { cause: 913 },
          );
        }
        if (!port.service && !!port?.namespace) {
          throw new Error(
            [
              cndiConfigLabel,
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"service"'),
              ccolors.error("key"),
            ].join(" "),
            { cause: 910 },
          );
        } else if (!port.namespace && !!port?.service) {
          throw new Error(
            [
              cndiConfigLabel,
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"namespace"'),
              ccolors.error("key"),
            ].join(" "),
            { cause: 909 },
          );
        }
        index++;
      }
    } else {
      throw new Error(
        [
          cndiConfigLabel,
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but"),
          ccolors.key_name('"infrastructure.cndi.open_ports"'),
          ccolors.error("must be an array of objects"),
        ].join(" "),
        { cause: 908 },
      );
    }
  }

  if (!config?.provider) {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"provider"'),
        ccolors.error("key"),
      ].join(" "),
      { cause: 920 },
    );
  }

  if (!config?.distribution) {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"distribution"'),
        ccolors.error("key"),
      ].join(" "),
      { cause: 921 },
    );
  }

  if (!config?.infrastructure?.cndi?.nodes?.[0]) {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have any"),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
        ccolors.error("entries"),
      ].join(" "),
      { cause: 902 },
    );
  }

  if (
    config?.provider === "dev" &&
    config?.infrastructure?.cndi?.nodes?.length > 1
  ) {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it has multiple"),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
        ccolors.error("entries with the"),
        ccolors.key_name('"kind"'),
        ccolors.error(
          'value of "dev". Only one node can be deployed when doing dev deployments.',
        ),
      ].join(" "),
      { cause: 911 },
    );
  }

  if (!config?.cndi_version) {
    console.log(
      cndiConfigLabel,
      ccolors.warn(`You haven't specified a`),
      ccolors.key_name(`"cndi_version"`),
      ccolors.warn(`in your config file, defaulting to "v2"`),
    );
  }

  const nodeNameSet = new Set();

  for (const node of config?.infrastructure?.cndi?.nodes) {
    if (!node.name) {
      throw new Error(
        [
          cndiConfigLabel,
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has at least one"),
          ccolors.key_name('"infrastructure.cndi.nodes"'),
          ccolors.error("entry that is missing a"),
          ccolors.key_name('"name"'),
          ccolors.error("value. Node names must be specified."),
        ].join(" "),
        { cause: 905 },
      );
    }
    nodeNameSet.add(node.name);
  }

  const nodeNamesAreUnique =
    nodeNameSet.size === config?.infrastructure?.cndi?.nodes?.length;

  if (!nodeNamesAreUnique) {
    throw new Error(
      [
        cndiConfigLabel,
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it has multiple "),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
        ccolors.error("entries with the same"),
        ccolors.key_name('"name"'),
        ccolors.error("values. Node names must be unique."),
      ].join(" "),
      { cause: 906 },
    );
  }
}
