import { ccolors } from "deps";
import { CNDIConfig } from "src/types.ts";
import { emitExitEvent } from "src/utils.ts";

const cndiConfigLabel = ccolors.faded("\nsrc/validate/cndiConfig.ts:");

export default async function validateConfig(
  config: CNDIConfig,
  pathToConfig: string,
): Promise<void> {
  if (!config?.project_name) {
    console.log(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it does not have the required"),
      ccolors.key_name('"project_name"'),
      ccolors.error("key"),
    );
    await emitExitEvent(900);
    Deno.exit(900);
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
    await emitExitEvent(901);
    Deno.exit(901);
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
    await emitExitEvent(902);
    Deno.exit(902);
  }

  const nodeIsMissingKind = config.infrastructure.cndi.nodes.every((node) =>
    !node?.kind
  );

  if (nodeIsMissingKind) {
    console.error(
      cndiConfigLabel,
      ccolors.error("cndi-config file found was at "),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("but it has atleast 1"),
      ccolors.key_name('"infrastructure.cndi.nodes"'),
      ccolors.error("entry missing a"),
      ccolors.key_name('"kind"'),
      ccolors.error('value. All nodes must specify a "kind".'),
    );
    await emitExitEvent(903);
    Deno.exit(903);
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
      ccolors.error('values. All nodes must be deployed with the same "kind".'),
    );
    await emitExitEvent(904);
    Deno.exit(904);
  }

  if(config?.infrastructure?.cndi?.nodes?.[0]?.kind === 'local'){
    if(config.infrastructure.cndi.nodes.length >1){
      console.error(
        cndiConfigLabel,
        ccolors.error("cndi-config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it has multiple"),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
        ccolors.error("entries with the"),
        ccolors.key_name('"kind"'),
        ccolors.error('value of "local". Only one node can be deployed when doing local deployments.'),
      )
    }
    Deno.exit(908)
  }

  if (!config.cndi_version) {
    console.log(
      cndiConfigLabel,
      ccolors.warn(`You haven't specified a`),
      ccolors.key_name(`"cndi_version"`),
      ccolors.warn(`in your config file, defaulting to "v1"`),
    );
  }

  const nodeNameSet = new Set();

  for (const node of config?.infrastructure?.cndi?.nodes) {
    if (!node.name) {
      console.error(
        cndiConfigLabel,
        ccolors.error("cndi-config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it has at least one"),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
        ccolors.error("entry that is missing a"),
        ccolors.key_name('"name"'),
        ccolors.error("value. Node names must be specified."),
      );
      await emitExitEvent(905);
      Deno.exit(905);
    }
    nodeNameSet.add(node.name);
  }

  const nodeNamesAreUnique =
    nodeNameSet.size === config?.infrastructure?.cndi?.nodes?.length;

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
    await emitExitEvent(906);
    Deno.exit(906);
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
    await emitExitEvent(907);
    Deno.exit(907);
  }
}
