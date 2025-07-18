import { ErrOut } from "errout";
import { CNDIConfigSpec, CNDIProvider } from "../types.ts";

import { validateCNDIConfigSpecComponentNetwork } from "./network.ts";
import { validateCNDIConfigSpecComponentNodes } from "./nodes.ts";
import { PROJECT_NAME_MAX_LENGTH } from "consts";
import { isSlug } from "src/utils.ts";
import { ccolors } from "deps";

const label = ccolors.faded("src/cndi_config/validate/mod.ts:");

/**
 * Maps each provider to its recommended distribution for microk8s deprecation warnings
 */
export function getRecommendedDistribution(provider: CNDIProvider): string {
  const recommendations: Record<CNDIProvider, string> = {
    aws: "eks",
    azure: "aks",
    gcp: "gke",
    dev: "microk8s", // Still valid for dev provider
  };
  return recommendations[provider];
}

export const cndiConfigFoundAtPath = (
  filePath: string,
) => ([
  ccolors.error("cndi_config file was found at"),
  ccolors.user_input(`"${filePath}"`),
].join(" "));

type ValidateCNDIConfigSpecOptions = {
  pathToConfig: string;
};

export function validateCNDIConfigSpec(
  cndiConfigSpec: CNDIConfigSpec,
  { pathToConfig }: ValidateCNDIConfigSpecOptions,
): ErrOut | void {
  // If all validations pass, return nothing (void)
  const metadataError = validateCNDIConfigSpecComponentMetadata(
    cndiConfigSpec,
    { pathToConfig },
  );
  if (metadataError) return metadataError;

  const networkError = validateCNDIConfigSpecComponentNetwork(cndiConfigSpec, {
    pathToConfig,
  });
  if (networkError) return networkError;
  const nodesError = validateCNDIConfigSpecComponentNodes(cndiConfigSpec, {
    pathToConfig,
  });
  if (nodesError) return nodesError;
}

function validateCNDIConfigSpecComponentMetadata(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  // Validate metadata fields like project_name, region, etc.
  // cndi_config must have a project_name
  if (!configSpec?.project_name) {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but it does not have the required"),
        ccolors.key_name("project_name"),
        ccolors.error("key"),
      ],
      {
        code: 900,
        id: "validate/cndi_config/!project_name",
        metadata: { configSpec },
        label,
      },
    );
  } else if (!isSlug(configSpec?.project_name)) {
    // project_name must be a valid slug
    // because it is used downstream when provisioning infrastructure
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but the"),
        ccolors.key_name("project_name"),
        ccolors.error("is not a valid slug"),
        ccolors.error(
          "it must only contain lowercase letters, numbers, and hyphens",
        ),
      ],
      {
        code: 903,
        id: "validate/cndi_config/!isSlug(project_name)",
        metadata: { configSpec },
        label,
      },
    );
  } else if (configSpec.project_name?.length > PROJECT_NAME_MAX_LENGTH) {
    // project_name must be less than 48 characters
    // because it is used downstream when provisioning infrastructure
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but the"),
        ccolors.key_name("project_name"),
        ccolors.error("value is too long.\n"),
        ccolors.error(
          "It must be",
        ),
        ccolors.warn(`${PROJECT_NAME_MAX_LENGTH}`),
        ccolors.error("characters or less."),
      ],
      {
        code: 904,
        id:
          `validate/cndi_config/project_name.length>${PROJECT_NAME_MAX_LENGTH}`,
        metadata: { configSpec },
        label,
      },
    );
  }

  if (!configSpec?.provider) {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but it does not have the required"),
        ccolors.key_name("provider"),
        ccolors.error("key"),
      ],
      {
        code: 916,
        id: "validate/cndi_config/!provider",
        metadata: { configSpec },
        label,
      },
    );
  }
  if (configSpec.cndi_version !== "v3") {
    console.warn(
      cndiConfigFoundAtPath(pathToConfig),
      ccolors.warn("but the required key"),
      ccolors.key_name("cndi_version"),
      ccolors.warn("has the unsupported value"),
      ccolors.user_input(configSpec.cndi_version),
    );
  } else {
    if (configSpec?.provider !== "dev") {
      if (!configSpec?.region) {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but the required"),
          ccolors.key_name("region"),
          ccolors.error("key is not defined"),
        ], {
          code: 933,
          id: "validate/cndi_config/!region",
          label,
          metadata: { configSpec, pathToConfig },
        });
      }

      if (configSpec?.distribution === "microk8s") {
        return new ErrOut([
          cndiConfigFoundAtPath(pathToConfig),
          ccolors.error("but the"),
          ccolors.key_name("distribution"),
          ccolors.user_input("microk8s"),
          ccolors.error("is not supported for your target provider"),
          ccolors.user_input(configSpec?.provider),
        ], {
          code: 943,
          id: "validate/cndi_config/distribution/microk8s",
          label,
          metadata: { provider: configSpec?.provider },
        });
      }
    }
  }
}
