import { ccolors, path } from "deps";
import { CNDIConfig } from "src/types.ts";
import { patchAndStageTerraformFilesWithConfig, stageFile } from "src/utils.ts";
import stageTerraformResourcesForAWSEC2 from "src/outputs/terraform/aws-ec2/stageAll.ts";
import stageTerraformResourcesForAWSEKS from "src/outputs/terraform/aws-eks/stageAll.ts";
import stageTerraformResourcesForGCP from "src/outputs/terraform/gcp/stageAll.ts";
import stageTerraformResourcesForAzure from "src/outputs/terraform/azure/stageAll.ts";

import cndi_join_token from "src/outputs/terraform/shared/cndi_join_token.tf.json.ts";
import variable from "src/outputs/terraform/shared/variable.tf.json.ts";
import global_locals from "src/outputs/terraform/shared/global.locals.tf.json.ts";

import leaderBootstrapTerraformTemplate from "src/bootstrap/leader_bootstrap_cndi.sh.ts";
import controllerBootstrapTerrformTemplate from "src/bootstrap/controller_bootstrap_cndi.sh.ts";

export default async function stageTerraformResourcesForConfig(
  config: CNDIConfig,
  options: { output: string; initializing: boolean },
) {
  const cndi_project_name = config.project_name!;

  const kind = config.infrastructure.cndi.nodes[0].kind;

  const node_name_list = config.infrastructure.cndi.nodes.map(({ name }) =>
    name
  );

  switch (kind) {
    case "aws":
      console.log(
        ccolors.key_name('"kind"'),
        ccolors.warn("is"),
        ccolors.user_input('"aws"'),
        ccolors.warn("defaulting to"),
        ccolors.key_name('"ec2"'),
      );
      await stageTerraformResourcesForAWSEC2(config);
      break;
    case "ec2":
      await stageTerraformResourcesForAWSEC2(config);
      break;
    case "eks":
      await stageTerraformResourcesForAWSEKS(config);
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
      global_locals({
        cndi_project_name,
        node_name_list,
      }),
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
