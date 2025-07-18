import { NormalizedCNDIConfig, TFBlocks } from "src/cndi_config/types.ts";
import { ErrOut } from "src/ErrOut.ts";
import { ccolors, deepMerge, path } from "src/deps.ts";
import {
  getPrettyJSONString,
  getStagingDirectory,
  stageFile,
} from "src/utils.ts";

const label = ccolors.faded(
  "src/outputs/terraform/passthru.ts:",
);

const TF_BLOCK_NAMES = [
  "terraform",
  "provider",
  "resource",
  "data",
  "output",
  "module",
  "locals",
  "variable",
] as const;

export async function processAndStageTerraformPassthru(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const pathToTerraformObjects = path.join(
    "cndi",
    "terraform",
  );

  const [err, stagingDirectory] = getStagingDirectory();

  if (err) return err;

  if (!cndi_config?.infrastructure?.terraform) {
    return null;
  }

  const terraformSpec: TFBlocks = cndi_config?.infrastructure?.terraform || {};

  for (const key in terraformSpec) {
    if (TF_BLOCK_NAMES.includes(key as keyof TFBlocks)) {
      if (key === "resource") {
        const resources = terraformSpec[key] as Record<string, unknown>;

        for (const resourceType in resources) {
          const resourcePath = path.join(
            stagingDirectory,
            pathToTerraformObjects,
            `cndi_${resourceType}.tf.json`,
          );

          const userResourceTfObjectSpec = resources[resourceType] as Record<
            string,
            unknown
          >;

          let existingResourceTfText = '{"resource":{}}';

          try {
            existingResourceTfText = await Deno.readTextFile(resourcePath);
          } catch (e) {
            if (e instanceof Deno.errors.NotFound) {
              // File does not exist, continue
            }
          }

          const existingResourceTfOject = JSON.parse(existingResourceTfText);

          const { resource } = existingResourceTfOject;

          const newResource = {
            ...deepMerge(resource, {
              [resourceType]: userResourceTfObjectSpec,
            }),
          };
          await stageFile(
            path.join(
              pathToTerraformObjects,
              `cndi_${resourceType}.tf.json`,
            ),
            getPrettyJSONString({
              resource: newResource,
            }),
          );
        }
      } else {
        const filePath = path.join(
          stagingDirectory,
          pathToTerraformObjects,
          `${key}.tf.json`, // eg. terraform.tf.json or data.tf.json
        );

        let existingTfText = `{"${key}":{}}`;

        try {
          existingTfText = await Deno.readTextFile(filePath);
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) {
            // File does not exist, continue
          }
        }

        const existingTfObject = JSON.parse(existingTfText);

        const tfObjectSpec = terraformSpec[key as keyof TFBlocks] as Record<
          string,
          unknown
        >;

        const tfObject = deepMerge(existingTfObject, { [key]: tfObjectSpec });

        if (Object.keys(tfObject[key]).length > 0) {
          await stageFile(
            path.join(
              pathToTerraformObjects,
              `${key}.tf.json`,
            ),
            getPrettyJSONString(
              tfObject,
            ),
          );
        }
      }
    } else {
      return new ErrOut([
        ccolors.error(
          `Unsupported terraform block type: ${key}`,
        ),
        ccolors.error(
          `Please use one of the following block types instead:`,
        ),
        TF_BLOCK_NAMES.join(", "),
      ], {
        label,
        code: -1,
        id: "unsupported-terraform-block-type",
      });
    }
  }
  return null;
}
