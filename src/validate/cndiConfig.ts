import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { BaseNodeItemSpec, CNDIConfig } from "../types.ts";
const cndiConfigLabel = colors.white("\n/src/validate/cndiConfig:");

export default function validateConfig(
  config: CNDIConfig,
  pathToConfig: string,
) {
  if (!config?.project_name) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it does not have the required ${
          colors.cyan(
            '"project_name"',
          )
        } key\n`,
      ),
    );
    Deno.exit(1);
  }

  if (!config?.infrastructure) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it does not have the required ${
          colors.cyan(
            '"infrastructure"',
          )
        } key\n`,
      ),
    );
    Deno.exit(1);
  }

  if (!config?.infrastructure?.cndi?.nodes?.[0]) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it does not have any ${
          colors.cyan(
            '"cndi.infrastructure.nodes"',
          )
        } entries\n`,
      ),
    );
    Deno.exit(1);
  }

  const onlyOneNodeKind = config.infrastructure.cndi.nodes.every(
    (node) => node.kind === config.infrastructure.cndi.nodes[0].kind,
  );

  if (!onlyOneNodeKind) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it has multiple ${
          colors.cyan(
            '"cndi.infrastructure.nodes"',
          )
        } entries with different ${
          colors.cyan(
            '"kind"',
          )
        } values. This is not supported.\n`,
      ),
    );
    Deno.exit(1);
  }

  if (!config.cndi_version) {
    console.log(
      cndiConfigLabel,
      colors.yellow(
        `You haven't specified a ${
          colors.cyan(
            '"cndi_version"',
          )
        } in your config file, defaulting to "v1"\n`,
      ),
    );
  }

  const deploymentTargets = new Set(
    config.infrastructure.cndi.nodes.map((node: BaseNodeItemSpec) => node.kind),
  );

  if (deploymentTargets.size > 1) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it has multiple ${
          colors.cyan(
            '"cndi.infrastructure.nodes"',
          )
        } entries with different ${
          colors.cyan(
            '"kind"',
          )
        } values. This is not supported.\n`,
      ),
    );
    Deno.exit(1);
  }

  const nodeNamesAreUnique =
    new Set(config?.infrastructure?.cndi?.nodes.map(({ name }) => (name)))
      .size ===
      config?.infrastructure?.cndi?.nodes.length;

  if (!nodeNamesAreUnique) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it has multiple ${
          colors.cyan(
            '"cndi.infrastructure.nodes"',
          )
        } entries with the same ${
          colors.cyan(
            '"name"',
          )
        } values. Node names must be unique.\n`,
      ),
    );
    Deno.exit(1);
  }

  const numberOfNodesWithRoleLeader =
    config?.infrastructure?.cndi?.nodes?.filter(
      ({ role }) => role === "leader",
    ).length;

  if (numberOfNodesWithRoleLeader !== 1) {
    console.log(
      cndiConfigLabel,
      colors.brightRed(
        `cndi-config file found was at ${
          colors.white(
            `"${pathToConfig}"`,
          )
        } but it does not have exactly 1 ${
          colors.cyan(
            '"cndi.infrastructure.nodes"',
          )
        } entry with ${
          colors.cyan(
            '"role": "leader',
          )
        }. There must be exactly one leader node.\n`,
      ),
    );
    Deno.exit(1);
  }
}
