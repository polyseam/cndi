import { ccolors } from "deps";
import { CNDIConfig } from "src/types.ts";

const cndiConfigLabel = ccolors.faded("\nsrc/validate/cndiConfig.ts:");

export default function validateConfig(
  config: CNDIConfig,
  pathToConfig: string,
) {
  if (!config?.project_name) {
    console.log(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it does not have the required"),
      ccolors.key_name('"project_name"'),
      ccolors.error("key"),
    );
    Deno.exit(1);
  }

  if (!config?.infrastructure) {
    console.error(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it does not have the required"),
      ccolors.key_name('"infrastructure"'),
      ccolors.error("key"),
    );
    Deno.exit(1);
  }

  if (!config?.infrastructure?.cndi?.nodes?.[0]) {
    console.error(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it does not have any"),
      ccolors.key_name('"infrastructure.cndi.nodes"'),
      ccolors.error("entries"),
    );
    Deno.exit(1);
  }

  const onlyOneNodeKind = config.infrastructure.cndi.nodes.every(
    (node) => node.kind === config.infrastructure.cndi.nodes[0].kind,
  );

  if (!onlyOneNodeKind) {
    console.error(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it has multiple"),
      ccolors.key_name('"infrastructure.cndi.nodes"'),
      ccolors.error("entries with different"),
      ccolors.key_name('"kind"'),
      ccolors.error("values. This is not supported."),
    );
    Deno.exit(1);
  }

  if (!config.cndi_version) {
    console.log(
      cndiConfigLabel,
      ccolors.warn(`You haven't specified a`),
      ccolors.key_name(`"cndi_version"`),
      ccolors.warn(`in your config file, defaulting to "v1"`),
    );
  }

  const nodeNamesAreUnique =
    new Set(config?.infrastructure?.cndi?.nodes.map(({ name }) => (name)))
      .size ===
      config?.infrastructure?.cndi?.nodes.length;

  if (!nodeNamesAreUnique) {
    console.error(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it has multiple "),
      ccolors.key_name('"infrastructure.cndi.nodes"'),
      ccolors.error("entries with the same"),
      ccolors.key_name('"name"'),
      ccolors.error("values. Node names must be unique."),
    );
    Deno.exit(1);
  }

  const numberOfNodesWithRoleLeader =
    config?.infrastructure?.cndi?.nodes?.filter(
      ({ role }) => role === "leader",
    ).length;

  if (numberOfNodesWithRoleLeader !== 1) {
    console.error(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at"),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it does not have exactly 1"),
      ccolors.key_name('"infrastructure.cndi.nodes"'),
      ccolors.error("entry with "),
      ccolors.key_name('"role"'),
      ccolors.error("is"),
      ccolors.key_name('"leader".'),
      ccolors.error("There must be exactly one leader node."),
    );
    Deno.exit(1);
  }
}
