import { ccolors } from "deps";
import { ErrOut } from "errout";
import { CNDIConfigSpec } from "../types.ts";

import {
  EFFECT_VALUES,
  NO_EXECUTE,
  NO_SCHEDULE,
  PREFER_NO_SCHEDULE,
} from "consts";

import { cndiConfigFoundAtPath } from "./mod.ts";

const label = ccolors.faded("src/cndi_config/validate/nodes.ts:");

export function validateCNDIConfigSpecComponentNodes(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  const { provider, distribution } = configSpec;
  const nodes = configSpec.infrastructure?.cndi?.nodes;
  const nodeNameSet = new Set();

  if (!nodes) {
    if (distribution === "clusterless") {
      // clusterless does not have nodes
      return;
    } else {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it does not have any"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entries. At least one node must be defined."),
        ],
        {
          code: 942,
          id: "validate/cndi_config/infrastructure.cndi.nodes/undefined",
          label,
        },
      );
    }
  }

  if (!Array.isArray(nodes)) {
    if (nodes === "auto") return;
  }

  for (const node of nodes) {
    if (!node.name) {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that is missing a"),
          ccolors.key_name("name"),
          ccolors.error("value. Node names must be specified."),
        ],
        {
          code: 905,
          id: "validate/cndi_config/infrastructure.cndi.nodes[*]!name",
          label,
        },
      );
    }

    const minType = typeof node?.min_count;
    const maxType = typeof node?.max_count;

    if (node.count) {
      if (node.min_count) {
        // min_count should not be specified along with count
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares both"),
          ccolors.key_name("count"),
          ccolors.error("and"),
          ccolors.key_name("min_count"),
          ccolors.error("values.\n"),
          ccolors.key_name("count"),
          ccolors.error(
            "should only be set if you want to deploy a fixed number of nodes.",
          ),
        ], {
          label,
          code: 918,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].count&&min_count",
        });
      }

      if (node.max_count) {
        // max_count should not be specified along with count
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares both"),
          ccolors.key_name("count"),
          ccolors.error("and"),
          ccolors.key_name("max_count"),
          ccolors.error("values.\n"),
          ccolors.key_name("count"),
          ccolors.error(
            "should only be set if you want to deploy a fixed number of nodes.",
          ),
        ], {
          label,
          code: 919,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].count&&max_count",
        });
      }
    } else if (minType === "undefined" && maxType === "undefined") {
      // do nothing because count, min_count, and max_count are not defined
      // default to count = 1
    } else {
      if (maxType === "undefined") {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("min_count"),
          ccolors.error("value but is missing a"),
          ccolors.key_name("max_count"),
          ccolors.error("value.\n"),
          ccolors.key_name("max_count"),
          ccolors.error("should be set to at least 1 if"),
          ccolors.key_name("min_count"),
          ccolors.error("is defined."),
        ], {
          label,
          code: 920,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].max_count&&min_count",
        });
      }

      if (minType === "undefined") {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("max_count"),
          ccolors.error("value but is missing a"),
          ccolors.key_name("min_count"),
          ccolors.error("value.\n"),
          ccolors.key_name("min_count"),
          ccolors.error("should be set to at least 1 if"),
          ccolors.key_name("max_count"),
          ccolors.error("is defined."),
        ], {
          label,
          code: 921,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].min_count&&max_count",
        });
      }

      if (!(minType === "number")) {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("min_count"),
          ccolors.error("value that is not a number.\n"),
          ccolors.key_name("min_count"),
          ccolors.error("should be a number greater than 0 if it is defined."),
        ], {
          label,
          code: 922,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].min_count.type!=number",
        });
      }

      if (!(maxType === "number")) {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("max_count"),
          ccolors.error("value that is not a number.\n"),
          ccolors.key_name("max_count"),
          ccolors.error("should be a number greater than 0 if it is defined."),
        ], {
          label,
          code: 923,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].max_count.type!=number",
        });
      }

      if (node.min_count === 0) {
        // min_count should not be 0
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("min_count"),
          ccolors.error("value of 0.\n"),
          ccolors.key_name("min_count"),
          ccolors.error("should be set to at least 1."),
        ], {
          label,
          code: 924,
          id: "validate/cndi_config/infrastructure.cndi.nodes[*].min_count===0",
        });
      }

      if (node.max_count! === node.min_count!) {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("max_count"),
          ccolors.error("value that is equal to"),
          ccolors.key_name("min_count"),
          ccolors.error("value.\n"),
          ccolors.error("if you want to set a fixed number of nodes, use"),
          ccolors.key_name("count"),
          ccolors.error("instead"),
        ], {
          label,
          code: 925,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].max_count===min_count",
        });
      }

      if (node.max_count! < node.min_count!) {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has at least one"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry that delares a"),
          ccolors.key_name("max_count"),
          ccolors.error("value that is less than"),
          ccolors.key_name("min_count"),
          ccolors.error("value.\n"),
          ccolors.key_name("max_count"),
          ccolors.error("should be set to more than"),
          ccolors.key_name("min_count"),
        ], {
          label,
          code: 926,
          id:
            "validate/cndi_config/infrastructure.cndi.nodes[*].max_count<min_count",
        });
      }
    }

    nodeNameSet.add(node.name);

    for (const taint of node.taints || []) {
      if (!taint?.effect) {
        return new ErrOut(
          [
            cndiConfigFoundAtPath(pathToConfig),
            ccolors.error("\nbut the"),
            ccolors.key_path("infrastructure.cndi.nodes"),
            ccolors.error("entry named"),
            ccolors.user_input(`"${node.name}"`),
            ccolors.error("has a taint without an"),
            ccolors.key_name("effect"),
            ccolors.error("value."),
            ccolors.error("\n\nTaint effects must be:"),
            ccolors.error(
              `${ccolors.key_name(NO_SCHEDULE)}, ${
                ccolors.key_name(PREFER_NO_SCHEDULE)
              }, or ${ccolors.key_name(NO_EXECUTE)}`,
            ),
          ],
          {
            code: 920,
            id:
              "validate/cndi_config/infrastructure.cndi.nodes[*].taints[*]!effect",
            label,
          },
        );
      } else {
        if (!EFFECT_VALUES.includes(taint.effect)) {
          return new ErrOut(
            [
              cndiConfigFoundAtPath(pathToConfig),
              ccolors.error("\nbut the"),
              ccolors.key_path("infrastructure.cndi.nodes"),
              ccolors.error("entry named"),
              ccolors.user_input(`${node.name}`),
              ccolors.error("has a taint with an invalid"),
              ccolors.key_name("effect"),
              ccolors.error("value."),
              ccolors.error("\n\nTaint effects must be:"),
              ccolors.error(
                `${ccolors.key_name(NO_SCHEDULE)}, ${
                  ccolors.key_name(PREFER_NO_SCHEDULE)
                }, or ${ccolors.key_name(NO_EXECUTE)}`,
              ),
              ccolors.error("\nYou supplied:"),
              ccolors.user_input(`"${taint.effect}"`),
            ],
            {
              code: 920,
              id: "validate/cndi_config/!EFFECT_VALUES",
              label,
            },
          );
        }
      }
    }
  }

  const nodeNamesAreUnique = nodeNameSet.size === nodes?.length;

  if (!nodeNamesAreUnique) {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but it has multiple "),
        ccolors.key_path("infrastructure.cndi.nodes"),
        ccolors.error("entries with the same"),
        ccolors.key_name("name"),
        ccolors.error("values. Node names must be unique."),
      ],
      {
        code: 906,
        id:
          "validate/cndi_config/infrastructure.cndi.nodes.every(unique(name))",
        label,
      },
    );
  }

  const firstNode = nodes?.[0];

  if (!firstNode) {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but it does not have any"),
        ccolors.key_path("infrastructure.cndi.nodes"),
        ccolors.error("entries"),
      ].join(" "),
      {
        code: 902,
        id: "validate/cndi_config/dev/!infrastructure.cndi.nodes.length>1",
        label,
      },
    );
  } else if (firstNode.taints?.length) {
    // throw on AKS
    if (distribution === "aks") {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error(
            "but taints are not allowed on the first node in aks",
          ),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("entry"),
        ],
        {
          code: 918,
          id:
            "validate/cndi_config/aks/infrastructure.cndi.nodes[0].taints.length",
          label,
        },
      );
    }
    // warn on other distributions
    console.log(
      label,
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
    provider === "dev"
  ) {
    const devNode = firstNode;

    if (devNode?.count && devNode.count !== 1) {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has a dev node with a"),
          ccolors.key_name("count"),
          ccolors.error("defined and not equal to"),
          ccolors.key_name("1"),
          ccolors.error(
            "Only one node can be deployed when doing dev deployments.",
          ),
        ],
        {
          code: 911,
          id: "validate/cndi_config/dev/count!=1",
          label,
        },
      );
    }

    if (devNode?.min_count && devNode.min_count !== 1) {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has a dev node with a"),
          ccolors.key_name("min_count"),
          ccolors.error("defined and not equal to"),
          ccolors.key_name("1"),
          ccolors.error(
            "Only one node can be deployed when doing dev deployments.",
          ),
        ],
        {
          code: 911,
          id: "validate/cndi_config/dev/min_count!=1",
          label,
        },
      );
    }

    if (devNode?.max_count && devNode.max_count !== 1) {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it has a dev node with a"),
          ccolors.key_name("max_count"),
          ccolors.error("defined and not equal to"),
          ccolors.key_name("1"),
          ccolors.error(
            "Only one node can be deployed when doing dev deployments.",
          ),
        ],
        {
          code: 911,
          id: "validate/cndi_config/dev/max_count!=1",
          label,
        },
      );
    }
  }

  // Validate bare provider specific node requirements
  if (provider === "bare") {
    // Handle missing nodes configuration
    if (!nodes) {
      return new ErrOut(
        [
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but it does not have any"),
          ccolors.key_path("infrastructure.cndi.nodes"),
          ccolors.error("configuration.\n"),
          ccolors.error("For bare/k3s deployments, you must specify either:"),
          ccolors.error("\n  - "),
          ccolors.user_input(`"auto"`),
          ccolors.error(" for automatic node discovery"),
          ccolors.error("\n  - An array of node specifications"),
        ],
        {
          code: 953,
          id: "validate/cndi_config/bare/missing-nodes",
          label,
        },
      );
    }

    // For bare provider, nodes can be "auto" or an array
    if (Array.isArray(nodes)) {
      // Validate leader node requirements
      const leaderNodes = nodes.filter((node) => node.role === "leader");

      if (leaderNodes.length === 0) {
        return new ErrOut(
          [
            cndiConfigFoundAtPath(pathToConfig),
            ccolors.error("but no node has"),
            ccolors.key_name("role"),
            ccolors.user_input(`"leader"`),
            ccolors.error("specified.\n"),
            ccolors.error(
              "For bare/k3s deployments, exactly one node must be designated as the leader.",
            ),
          ],
          {
            code: 954,
            id: "validate/cndi_config/bare/no-leader-node",
            label,
          },
        );
      }

      if (leaderNodes.length > 1) {
        return new ErrOut(
          [
            cndiConfigFoundAtPath(pathToConfig),
            ccolors.error("but multiple nodes have"),
            ccolors.key_name("role"),
            ccolors.user_input(`"leader"`),
            ccolors.error("specified.\n"),
            ccolors.error(
              "For bare/k3s deployments, exactly one node must be designated as the leader.",
            ),
          ],
          {
            code: 955,
            id: "validate/cndi_config/bare/multiple-leader-nodes",
            label,
          },
        );
      }

      // Validate individual node specifications
      for (const node of nodes) {
        // Validate tag format if specified
        if (node.tag && !node.tag.startsWith("tag:")) {
          return new ErrOut(
            [
              cndiConfigFoundAtPath(pathToConfig),
              ccolors.error("but node"),
              ccolors.user_input(`"${node.name}"`),
              ccolors.error("has an invalid"),
              ccolors.key_name("tag"),
              ccolors.error("format.\n"),
              ccolors.error("Tags must start with"),
              ccolors.user_input(`"tag:"`),
              ccolors.error("prefix. Example:"),
              ccolors.user_input(`"tag:cndi--my-cluster"`),
            ],
            {
              code: 956,
              id: "validate/cndi_config/bare/invalid-tag-format",
              metadata: { nodeName: node.name },
              label,
            },
          );
        }

        // Validate that node has either host or tag
        if (!node.host && !node.tag) {
          return new ErrOut(
            [
              cndiConfigFoundAtPath(pathToConfig),
              ccolors.error("but node"),
              ccolors.user_input(`"${node.name}"`),
              ccolors.error("is missing both"),
              ccolors.key_name("host"),
              ccolors.error("and"),
              ccolors.key_name("tag"),
              ccolors.error("properties.\n"),
              ccolors.error("Each node must specify either a"),
              ccolors.key_name("host"),
              ccolors.error("(MagicDNS address or IP) or a"),
              ccolors.key_name("tag"),
              ccolors.error("for discovery."),
            ],
            {
              code: 957,
              id: "validate/cndi_config/bare/node-missing-host-and-tag",
              metadata: { nodeName: node.name },
              label,
            },
          );
        }

        // Validate host format if specified
        if (node.host) {
          const isIPv4 = /^100\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(node.host);
          const isMagicDNS = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/.test(
            node.host,
          );

          if (!isIPv4 && !isMagicDNS) {
            return new ErrOut(
              [
                cndiConfigFoundAtPath(pathToConfig),
                ccolors.error("but node"),
                ccolors.user_input(`"${node.name}"`),
                ccolors.error("has an invalid"),
                ccolors.key_name("host"),
                ccolors.error("format.\n"),
                ccolors.error("Host must be either:"),
                ccolors.error("\n  - A Tailscale IP (100.x.x.x)"),
                ccolors.error(
                  "\n  - A MagicDNS address (e.g., mynode.example.ts.net)",
                ),
              ],
              {
                code: 958,
                id: "validate/cndi_config/bare/invalid-host-format",
                metadata: { nodeName: node.name, host: node.host },
                label,
              },
            );
          }
        }

        // Validate that nodes don't use cloud-specific properties
        const cloudSpecificProps = [
          "instance_type",
          "machine_type",
          "vm_size",
          "disk_type",
          "min_count",
          "max_count",
          "count",
          "volume_size",
          "disk_size_gb",
          "disk_size",
          "size",
          "cpus",
          "memory",
          "disk",
        ];

        for (const prop of cloudSpecificProps) {
          // deno-lint-ignore no-explicit-any
          const nx = node as unknown as any;
          if (nx[prop] !== undefined) {
            return new ErrOut(
              [
                cndiConfigFoundAtPath(pathToConfig),
                ccolors.error("but node"),
                ccolors.user_input(`"${node.name}"`),
                ccolors.error("has property"),
                ccolors.key_name(prop),
                ccolors.error(
                  "which is not supported for bare/k3s deployments.\n",
                ),
                ccolors.error(
                  "Bare nodes are pre-existing machines discovered via Tailscale.",
                ),
                ccolors.error("Only"),
                ccolors.key_name("name"),
                ccolors.error(","),
                ccolors.key_name("role"),
                ccolors.error(","),
                ccolors.key_name("host"),
                ccolors.error(", and"),
                ccolors.key_name("tag"),
                ccolors.error("properties are supported."),
              ],
              {
                code: 959,
                id: "validate/cndi_config/bare/unsupported-node-property",
                metadata: { nodeName: node.name, property: prop },
                label,
              },
            );
          }
        }
      }
    }
  }
}
