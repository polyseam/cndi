import { ccolors } from "deps";
import { CNDIConfig } from "src/types.ts";
import { isSlug } from "src/utils.ts";

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
      { cause: 914 },
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
  } else if (config?.project_name) {
    if (!isSlug(config?.project_name)) {
      throw new Error(
        [
          cndiConfigLabel,
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but the"),
          ccolors.key_name('"project_name"'),
          ccolors.error("is not a valid slug"),
          ccolors.error(
            "it must only contain lowercase letters, numbers, and hyphens",
          ),
        ].join(" "),
        { cause: 903 },
      );
    }
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

  if (config?.infrastructure?.cndi?.cert_manager) {
    if (config?.infrastructure?.cndi?.cert_manager?.enabled === false) {
      // cert_manager is disabled explicitly
    } else if (
      !config?.infrastructure?.cndi?.cert_manager?.self_signed &&
      !config?.infrastructure?.cndi?.cert_manager?.email
    ) {
      throw new Error(
        [
          cndiConfigLabel,
          ccolors.error("cndi_config file found was at"),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("\nwith"),
          ccolors.key_name("infrastructure.cndi.cert_manager"),
          ccolors.error("present but missing one of the required keys:"),
          ccolors.key_name("\ninfrastructure.cndi.cert_manager.self_signed"),
          ccolors.error("or"),
          ccolors.key_name("infrastructure.cndi.cert_manager.email"),
        ].join(" "),
        { cause: 915 },
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
      { cause: 916 },
    );
  }

  const isClusterless = config?.distribution === "clusterless";

  if (isClusterless) {
    if (config?.provider === "dev") {
      throw new Error(
        [
          cndiConfigLabel,
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has"),
          ccolors.key_name('"distribution"'),
          ccolors.error("set to"),
          ccolors.user_input('"clusterless"'),
          ccolors.error("while the"),
          ccolors.key_name('"provider"'),
          ccolors.error("is set to"),
          ccolors.user_input('"dev"'),
          ccolors.error("which is not supported"),
        ].join(" "),
        { cause: 918 },
      );
    }
    if (config?.infrastructure?.cndi) {
      throw new Error(
        [
          cndiConfigLabel,
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has"),
          ccolors.key_name('"infrastructure.cndi"'),
          ccolors.error("entries in clusterless mode"),
        ].join(" "),
        { cause: 919 },
      );
    }
    // TODO: throw if cluster things are present in clusterless mode
  } else {
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
        { cause: 917 },
      );
    }

    const firstNode = config?.infrastructure?.cndi?.nodes?.[0];

    if (!firstNode) {
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
    } else if (firstNode.taints?.length) {
      // throw on AKS
      if (config?.distribution === "aks") {
        throw new Error(
          [
            cndiConfigLabel,
            ccolors.error("cndi_config file found was at "),
            ccolors.user_input(`"${pathToConfig}"`),
            ccolors.error(
              "but taints are not allowed on the first node in aks",
            ),
            ccolors.key_name('"infrastructure.cndi.nodes"'),
            ccolors.error("entry"),
          ].join(" "),
          { cause: 918 },
        );
      }
      // warn on other distributions
      console.log(
        "\n",
        cndiConfigLabel,
        ccolors.warn(
          "Warning:",
        ),
        ccolors.key_name("taints"),
        ccolors.warn(
          "are only supported in the first node group when using",
        ),
        ccolors.key_name("distribution"),
        ccolors.user_input(`gke`),
        ccolors.warn("or"),
        ccolors.user_input(`eks`),
        ccolors.warn("!\n"),
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
}
