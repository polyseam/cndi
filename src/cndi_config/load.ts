import { ccolors, exists, path, YAML } from "deps";
import { CNDIConfigSpec, NormalizedCNDIConfig } from "./types.ts";
import { ErrOut } from "errout";
import { validateCNDIConfigSpec } from "./validate/mod.ts";

const label = ccolors.faded("\nsrc/cndi_config/load.ts:");

function normalizeCNDIConfig(
  cndiConfigSpec: CNDIConfigSpec,
): NormalizedCNDIConfig {
  // Normalize the CNDIConfig structure by interpolating default values
  const normalizedCNDIConfig = {
    cluster_manifests: {},
    applications: {},
    ...cndiConfigSpec,
  };
  return normalizedCNDIConfig;
}

type LoadConfigSuccessResult = {
  config: NormalizedCNDIConfig;
  pathToConfig: string;
};

export type PxSuccessResult<T> = [undefined, T];
export type PxErrorResult = [ErrOut];
export type PxResult<T> = PxSuccessResult<T> | PxErrorResult;

// attempts to find cndi_config.yaml or cndi_config.jsonc, then returns its value and location
export const loadCNDIConfig = async (
  projectDirectory: string,
): Promise<PxResult<LoadConfigSuccessResult>> => {
  let pathToConfig = path.join(projectDirectory, "cndi_config.yaml");

  if (!(await exists(pathToConfig))) {
    pathToConfig = path.join(projectDirectory, "cndi_config.yml");
  }

  if (!(await exists(pathToConfig))) {
    return [
      new ErrOut(
        [
          ccolors.error("failed to find a"),
          ccolors.key_name(`cndi_config.yaml`),
          ccolors.error("file at"),
          ccolors.user_input(path.join(projectDirectory, "cndi_config.yaml")),
        ],
        {
          id: "loadCndiConfig/not-found",
          code: 500,
          metadata: {
            pathToConfig,
          },
          label,
        },
      ),
    ];
  }

  let configText: string;

  try {
    configText = await Deno.readTextFile(pathToConfig);
  } catch (errorReadingFile) {
    return [
      new ErrOut(
        [
          ccolors.error("could not read"),
          ccolors.key_name(`cndi_config.yaml`),
          ccolors.error("file at"),
          ccolors.user_input(`"${pathToConfig}"`),
        ],
        {
          code: 504,
          id: "loadCndiConfig/read-text-error",
          metadata: {
            pathToConfig,
          },
          label,
          cause: errorReadingFile as Error,
        },
      ),
    ];
  }

  let configSpec: CNDIConfigSpec;

  try {
    configSpec = YAML.parse(configText) as CNDIConfigSpec;
  } catch (errorParsingFile) {
    return [
      new ErrOut(
        [
          ccolors.error("could not parse"),
          ccolors.key_name(`cndi_config.yaml`),
          ccolors.error("file at"),
          ccolors.user_input(`"${pathToConfig}"`),
        ],
        {
          code: 1300,
          id: "loadCndiConfig/parse-yaml-error",
          metadata: {
            pathToConfig,
          },
          label,
          cause: errorParsingFile as Error,
        },
      ),
    ];
  }

  const validationError = validateCNDIConfigSpec(configSpec, {
    pathToConfig,
  });

  if (validationError) return [validationError];

  const config = normalizeCNDIConfig(configSpec);

  return [undefined, { config, pathToConfig }];
};
