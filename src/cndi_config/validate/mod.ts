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
    bare: "k3s", // Recommended distribution for bare provider
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

  // Validate bare/k3s specific configuration (non-node validation)
  if (cndiConfigSpec.provider === "bare") {
    const bareError = validateBareK3sConfiguration(cndiConfigSpec, {
      pathToConfig,
    });
    if (bareError) return bareError;
  }
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
    if (configSpec?.provider !== "dev" && configSpec?.provider !== "bare") {
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

/**
 * Validates bare/k3s specific configuration
 */
function validateBareK3sConfiguration(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  // Validate that distribution is k3s for bare provider
  if (configSpec.distribution !== "k3s") {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but the"),
        ccolors.key_name("distribution"),
        ccolors.user_input(`"${configSpec.distribution}"`),
        ccolors.error("is not supported for"),
        ccolors.key_name("provider"),
        ccolors.user_input(`"bare"`),
        ccolors.error(".\n"),
        ccolors.error("The bare provider only supports"),
        ccolors.user_input(`"k3s"`),
        ccolors.error("distribution."),
      ],
      {
        code: 950,
        id: "validate/cndi_config/bare/unsupported-distribution",
        metadata: { configSpec },
        label,
      },
    );
  }

  // Validate Tailscale configuration is present
  if (!configSpec.infrastructure?.cndi?.tailscale) {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but it does not have the required"),
        ccolors.key_path("infrastructure.cndi.tailscale"),
        ccolors.error("configuration.\n"),
        ccolors.error(
          "The bare/k3s deployment target requires Tailscale configuration.",
        ),
      ],
      {
        code: 951,
        id: "validate/cndi_config/bare/missing-tailscale-config",
        metadata: { configSpec },
        label,
      },
    );
  }

  // Validate tailnet is specified
  if (!configSpec.infrastructure?.cndi?.tailscale?.tailnet) {
    return new ErrOut(
      [
        cndiConfigFoundAtPath(pathToConfig),
        ccolors.error("but the"),
        ccolors.key_path("infrastructure.tailscale.tailnet"),
        ccolors.error("is not specified.\n"),
        ccolors.error("A tailnet name is required for bare/k3s deployments."),
        ccolors.error("Example:"),
        ccolors.user_input(`"example-platypus.ts.net"`),
      ],
      {
        code: 952,
        id: "validate/cndi_config/bare/missing-tailnet",
        metadata: { configSpec },
        label,
      },
    );
  }

  // Node-specific validation for bare/k3s is handled in nodes.ts

  // Validate region is not required for bare provider
  if (configSpec.region) {
    console.warn(
      cndiConfigFoundAtPath(pathToConfig),
      ccolors.warn("has a"),
      ccolors.key_name("region"),
      ccolors.warn("specified, but this is not used for bare/k3s deployments."),
      ccolors.warn("The region field will be ignored."),
    );
  }
}
