import { CNDIConfig } from "src/types.ts";
import { stageFile } from "src/utils.ts";
import stageTerraformResourcesForAWS from "./aws/stageAll.ts";
import stageTerraformResourcesForGCP from "./gcp/stageAll.ts";
import stageTerraformResourcesForAzure from "./azure/stageAll.ts";
import * as path from "https://deno.land/std@0.172.0/path/mod.ts";

import join_token from "./shared/join_token.tf.json.ts";
import variable from "./shared/variable.tf.json.ts";
import terraform from "./shared/terraform.tf.json.ts";
import global_locals from "./shared/global.locals.tf.json.ts";

export default async function stageTerraformResourcesForConfig(
  config: CNDIConfig,
  options: { output: string; initializing: boolean },
) {
  const cndi_project_name = config.project_name!;

  const kind = config.infrastructure.cndi.nodes[0].kind;
  switch (kind) {
    case "aws":
      await stageTerraformResourcesForAWS(config);
      break;
    case "gcp":
      await stageTerraformResourcesForGCP(config, options);
      break;
    case "azure":
      await stageTerraformResourcesForAzure(config);
      break;
    default:
      throw new Error(`Unknown kind: ${kind}`);
  }

  await Promise.all([
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform()),
    stageFile(path.join("cndi", "terraform", "variables.tf.json"), variable()),
    stageFile(
      path.join("cndi", "terraform", "global.locals.tf.json"),
      global_locals({ cndi_project_name }),
    ),
    stageFile(
      path.join("cndi", "terraform", "join_token.tf.json"),
      join_token(),
    ),
  ]);
}
