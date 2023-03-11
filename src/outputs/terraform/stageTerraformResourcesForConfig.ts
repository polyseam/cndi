import { CNDIConfig } from "src/types.ts";
import { patchAndStageTerraformFilesWithConfig, stageFile } from "src/utils.ts";
import stageTerraformResourcesForAWS from "./aws/stageAll.ts";
import stageTerraformResourcesForGCP from "./gcp/stageAll.ts";
import stageTerraformResourcesForAzure from "./azure/stageAll.ts";
import * as path from "https://deno.land/std@0.172.0/path/mod.ts";

import cndi_join_token from "./shared/cndi_join_token.tf.json.ts";
import variable from "./shared/variable.tf.json.ts";
import global_locals from "./shared/global.locals.tf.json.ts";

import leaderBootstrapTerraformTemplate from "src/bootstrap/leader_bootstrap_cndi.sh.ts";
import controllerBootstrapTerrformTemplate from "src/bootstrap/controller_bootstrap_cndi.sh.ts";

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
    // add global variables
    stageFile(path.join("cndi", "terraform", "variables.tf.json"), variable()),
    // add global locals
    stageFile(
      path.join("cndi", "terraform", "global.locals.tf.json"),
      global_locals({ cndi_project_name }),
    ),
    // write the microk8s join token generator
    stageFile(
      path.join("cndi", "terraform", "cndi_join_token.tf.json"),
      cndi_join_token(),
    ),
    // write tftpl terraform template for the user_data bootstrap script
    stageFile(
      path.join("cndi", "terraform", "leader_bootstrap_cndi.sh.tftpl"),
      leaderBootstrapTerraformTemplate,
    ),
    stageFile(
      path.join("cndi", "terraform", "controller_bootstrap_cndi.sh.tftpl"),
      controllerBootstrapTerrformTemplate,
    ),
  ]);

  await patchAndStageTerraformFilesWithConfig(config);
}
