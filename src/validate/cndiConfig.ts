import { ccolors } from "deps";
import {
  CNDIConfig,
  CNDIDistribution,
  CNDIInfrastructure,
  CNDINodeSpec,
  CNDIProvider,
} from "src/types.ts";
import { isSlug } from "src/utils.ts";
import {
  EFFECT_VALUES,
  NO_EXECUTE,
  NO_SCHEDULE,
  PREFER_NO_SCHEDULE,
} from "consts";

import { ErrOut } from "errout";

type CNDIMeta = {
  distribution: CNDIDistribution;
  provider: CNDIProvider;
  project_name: string;
  cndi_version: string;
  pathToConfig: string;
};

const label = ccolors.faded("\nsrc/validate/cndiConfig.ts:");

const PROVIDERS_SUPPORTING_KEYLESS: Array<CNDIProvider> = [];

interface Manifest {
  kind: string;
  apiVersion: string;
  metadata: {
    name: string;
    namespace?: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// if the user's cndi_config.yaml can be statically analyzed to be critically invalid
// we must catch it now before consuming resources and writing to the filesystem
// "critically invalid" means that the current command has no hope of synthesizing the user's desired state
export default function validateConfig(
  config: CNDIConfig,
  pathToConfig: string,
): ErrOut | void {
  let cndi_version = config?.cndi_version;
  // CNDI Version must be undefined or "v2"
  if (cndi_version) {
    if (config.cndi_version !== "v2") {
      console.log();
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has an unsupported"),
          ccolors.key_name('"cndi_version"'),
          ccolors.error("value. Only"),
          ccolors.key_name("v2"),
          ccolors.error("is supported."),
        ],
        {
          code: 914,
          id: "validate/cndi_config/cndi_version!=v2",
          metadata: { config },
          label,
        },
      );
    }
  } else {
    cndi_version = "v2";
  }

  // cndi_config must have a project_name
  if (!config?.project_name) {
    console.log();
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"project_name"'),
        ccolors.error("key"),
      ],
      {
        code: 900,
        id: "validate/cndi_config/!project_name",
        metadata: { config },
        label,
      },
    );
  } else if (!isSlug(config?.project_name)) {
    // project_name must be a valid slug
    // because it is used downstream when provisioning infrastructure
    console.log();
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but the"),
        ccolors.key_name('"project_name"'),
        ccolors.error("is not a valid slug"),
        ccolors.error(
          "it must only contain lowercase letters, numbers, and hyphens",
        ),
      ],
      {
        code: 903,
        id: "validate/cndi_config/!isSlug(project_name)",
        metadata: { config },
        label,
      },
    );
  }

  if (!config?.provider) {
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"provider"'),
        ccolors.error("key"),
      ],
      {
        code: 916,
        id: "validate/cndi_config/!provider",
        metadata: { config },
        label,
      },
    );
  }

  if (config?.distribution === "clusterless") {
    if (config?.provider === "dev") {
      return new ErrOut(
        [
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
        ],
        {
          code: 918,
          id: "validate/cndi_config/clusterless/provider==dev",
          metadata: { config },
          label,
        },
      );
    }

    // assumes all objects under infrastructure.cndi are not applicable in clusterless mode
    if (config?.infrastructure?.cndi) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has"),
          ccolors.key_name('"infrastructure.cndi"'),
          ccolors.error("entries in clusterless mode"),
        ],
        {
          code: 919,
          id:
            "validate/cndi_config/clusterless/infrastructure.cndi.nodes.length",
          metadata: { config },
          label,
        },
      );
    }
  }

  if (!config?.distribution) {
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"distribution"'),
        ccolors.error("key"),
      ],
      {
        code: 917,
        id: "validate/cndi_config/!distribution",
        metadata: { config },
        label,
      },
    );
  }

  const distribution = config.distribution as CNDIDistribution;
  const provider = config.provider as CNDIProvider;
  const project_name = config.project_name;

  const meta = {
    distribution,
    provider,
    project_name,
    cndi_version,
    pathToConfig,
  };

  const infrastructureE = validateInfrastructureSpec(
    config.infrastructure,
    meta,
  );

  if (infrastructureE) return infrastructureE;

  const cluster_manifestsE = validateClusterManifestsSpec(
    config.cluster_manifests as Record<string, Manifest>,
    meta,
  );

  if (cluster_manifestsE) return cluster_manifestsE;
}

function validateInfrastructureComponentCndiNodes(
  nodes: CNDINodeSpec[],
  meta: CNDIMeta,
): ErrOut | void {
  const { pathToConfig, distribution, provider } = meta;

  const nodeNameSet = new Set();

  for (const node of nodes) {
    if (!node.name) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has at least one"),
          ccolors.key_name('"infrastructure.cndi.nodes"'),
          ccolors.error("entry that is missing a"),
          ccolors.key_name('"name"'),
          ccolors.error("value. Node names must be specified."),
        ],
        {
          code: 905,
          id: "validate/cndi_config/infrastructure.cndi.nodes[*]!name",
          label,
        },
      );
    }

    nodeNameSet.add(node.name);

    for (const taint of node.taints || []) {
      if (!taint?.effect) {
        return new ErrOut(
          [
            ccolors.error("cndi_config file found was at "),
            ccolors.user_input(`"${pathToConfig}"`),
            ccolors.error("\nbut the"),
            ccolors.key_name('"infrastructure.cndi.nodes"'),
            ccolors.error("entry named"),
            ccolors.user_input(`"${node.name}"`),
            ccolors.error("has a taint without an"),
            ccolors.key_name('"effect"'),
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
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error("\nbut the"),
              ccolors.key_name('"infrastructure.cndi.nodes"'),
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
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it has multiple "),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
        ccolors.error("entries with the same"),
        ccolors.key_name('"name"'),
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
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have any"),
        ccolors.key_name('"infrastructure.cndi.nodes"'),
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
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error(
            "but taints are not allowed on the first node in aks",
          ),
          ccolors.key_name('"infrastructure.cndi.nodes"'),
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
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
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
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
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
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
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
}

function validateInfrastructureSpec(
  infrastructure: CNDIInfrastructure,
  meta: CNDIMeta,
): ErrOut | void {
  const { pathToConfig, provider } = meta;

  if (!infrastructure) {
    console.log();
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"infrastructure"'),
        ccolors.error("key"),
      ],
      {
        code: 901,
        id: "validate/cndi_config/!infrastructure",
        label,
      },
    );
  }

  if (infrastructure?.cndi?.keyless === true) {
    if (!PROVIDERS_SUPPORTING_KEYLESS.includes(provider)) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but it has"),
          ccolors.key_name('"infrastructure.cndi.keyless"'),
          ccolors.error("set to"),
          ccolors.user_input('"true"'),
          ccolors.error("while"),
          ccolors.key_name("keyless"),
          ccolors.error("deployments are not supported in"),
          ccolors.user_input(provider),
        ],
        {
          code: 921,
          id: "validate/cndi_config/keyless/!keylessSupported(provider)",
          label,
        },
      );
    }
  }

  const open_ports = infrastructure?.cndi?.open_ports;

  if (open_ports) {
    if (Array.isArray(open_ports)) {
      let index = 0;
      for (const port of open_ports) {
        if (!port.number) {
          return new ErrOut(
            [
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"number"'),
              ccolors.error("key"),
            ],
            {
              code: 912,
              id: "validate/cndi_config/!open_ports[n][number]",
              label,
            },
          );
        }

        if (!port.name) {
          return new ErrOut(
            [
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"name"'),
              ccolors.error("key"),
            ],
            {
              code: 913,
              id: "validate/cndi_config/!open_ports[n][name]",
              label,
            },
          );
        }
        if (!port.service && !!port?.namespace) {
          return new ErrOut(
            [
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"service"'),
              ccolors.error("key"),
            ],
            {
              code: 910,
              id: "validate/cndi_config/!open_ports[n][service]",
              label,
            },
          );
        } else if (!port.namespace && !!port?.service) {
          return new ErrOut(
            [
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"`),
              ccolors.error(
                `but 'cndi_config.infrastructure.cndi.open_ports[${index}]' is missing the`,
              ),
              ccolors.key_name('"namespace"'),
              ccolors.error("key"),
            ].join(" "),
            {
              code: 909,
              id: "validate/cndi_config/!open_ports[n][namespace]",
              label,
            },
          );
        }
        index++;
      }
    } else {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("but"),
          ccolors.key_name('"infrastructure.cndi.open_ports"'),
          ccolors.error("must be an array of objects if set"),
        ],
        {
          code: 908,
          id: "validate/cndi_config/!isArray(open_ports)",
          label,
        },
      );
    }
  }

  if (infrastructure?.cndi?.cert_manager) {
    if (infrastructure?.cndi?.cert_manager?.enabled === false) {
      // cert_manager is disabled explicitly
    } else if (
      !infrastructure?.cndi?.cert_manager?.self_signed &&
      !infrastructure?.cndi?.cert_manager?.email
    ) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at"),
          ccolors.user_input(`"${pathToConfig}"`),
          ccolors.error("\nwith"),
          ccolors.key_name("infrastructure.cndi.cert_manager"),
          ccolors.error("present but missing one of the required keys:"),
          ccolors.key_name("\ninfrastructure.cndi.cert_manager.self_signed"),
          ccolors.error("or"),
          ccolors.key_name("infrastructure.cndi.cert_manager.email"),
        ],
        {
          code: 915,
          id: "validate/cndi_config/cert_manager![email|self_signed]",
          label,
        },
      );
    }
  }
  const errout = validateInfrastructureComponentCndiNodes(
    infrastructure.cndi.nodes,
    meta,
  );
  if (errout) return errout;
}

const CNDI_SECRET_MANIFEST_DATA_PREFIX =
  "$cndi_on_ow.seal_secret_from_env_var(";
const CNDI_SECRET_MANIFEST_DATA_SUFFIX = ")";

function parseCNDISecretDataForSealing(key: string): string | null {
  if (
    key.startsWith(CNDI_SECRET_MANIFEST_DATA_PREFIX) &&
    key.endsWith(CNDI_SECRET_MANIFEST_DATA_SUFFIX)
  ) {
    return key.slice(
      CNDI_SECRET_MANIFEST_DATA_PREFIX.length,
      key.length - CNDI_SECRET_MANIFEST_DATA_SUFFIX.length,
    );
  }
  return null;
}

function validateClusterManifestsSpec(
  cluster_manifests: Record<string, Manifest>,
  meta: CNDIMeta,
): ErrOut | void {
  const { pathToConfig } = meta;

  for (const entry of Object.entries(cluster_manifests)) {
    const filename = entry[0];
    const manifest = entry[1] as Manifest;

    if (manifest.kind === "Secret") {
      const d = (manifest?.stringData || manifest?.data) as Record<
        string,
        unknown
      >;
      if (!d) {
        console.log(
          "Secret manifest should have either",
          ccolors.key_name("stringData"),
          "or",
          ccolors.key_name("data"),
        );
      } else {
        for (const key in d) {
          const val = `${d[key]}`;
          const sealedData = parseCNDISecretDataForSealing(val);
          if (!sealedData) {
            return new ErrOut(
              [
                ccolors.error("cndi_config file found was at"),
                ccolors.user_input(`"${pathToConfig}"\n`),
                ccolors.error("with a"),
                ccolors.key_name(`Secret`),
                ccolors.error("at"),
                ccolors.key_name(`cluster_manifests.${filename}\n`),
                ccolors.error("which specifies a string literal value for"),
                ccolors.key_name(`"${key}"\n\n`),
                ccolors.warn("You should use the"),
                ccolors.user_input(
                  "$cndi_on_ow.seal_secret_from_env_var(MY_ENV_VAR)",
                ),
                ccolors.warn("macro instead"),
              ],
              {
                code: 700,
                id: "validate/cndi_config/cert_manager![email|self_signed]",
                label,
              },
            );
          }
        }
      }
    }
  }
}
