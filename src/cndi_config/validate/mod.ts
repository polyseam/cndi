import { ErrOut } from "errout";
import { CNDIConfigSpec } from "../types.ts";

import { validateCNDIConfigSpecComponentNetwork } from "./network.ts";
import { PROJECT_NAME_MAX_LENGTH } from "consts";
import { isSlug } from "src/utils.ts";
import { ccolors } from "deps";

const label = "\nsrc/cndi_config/validate/mod.ts:";

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
}

function validateCNDIConfigSpecComponentMetadata(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  // Validate metadata fields like project_name, region, etc.
  // cndi_config must have a project_name
  if (!configSpec?.project_name) {
    console.log();
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\n`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"project_name"'),
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
    console.log();
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\n`),
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
        metadata: { configSpec },
        label,
      },
    );
  } else if (configSpec.project_name?.length > PROJECT_NAME_MAX_LENGTH) {
    // project_name must be less than 48 characters
    // because it is used downstream when provisioning infrastructure
    console.log();
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\n`),
        ccolors.error("but the"),
        ccolors.key_name('"project_name"'),
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
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\n`),
        ccolors.error("but it does not have the required"),
        ccolors.key_name('"provider"'),
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

  if (!configSpec.region && configSpec.provider !== "dev") {
    return new ErrOut([
      ccolors.error("cndi_config file found was at "),
      ccolors.user_input(`"${pathToConfig}"\n`),
      ccolors.error("but the"),
      ccolors.key_name('"region"'),
      ccolors.error("key is not defined"),
      ccolors.error(
        "the region property is required for all providers except 'dev'",
      ),
    ], {
      code: 1,
      id: "validateCndiConfig/region-required",
      label,
      metadata: { configSpec, pathToConfig },
    });
  }
}
