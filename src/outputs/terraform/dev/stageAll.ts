import { ccolors, path } from "deps";

import { CNDIConfig } from "src/types.ts";
import { emitExitEvent, stageFile } from "src/utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_dev_locals from "./locals.tf.json.ts";
import cndi_multipass_instance from "./cndi_multipass_instance.tf.json.ts";

const devStageAllLabel = ccolors.faded(
  "\nsrc/outputs/terraform/dev/stageAll.ts:",
);

export default async function stageTerraformResourcesForGCP(
  config: CNDIConfig,
) {
  const node = config.infrastructure.cndi.nodes[0];

  // stage all the terraform files at once
  try {
    await Promise.all([
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_dev_locals(),
      ),
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider(),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_multipass_instance.tf.json"),
        cndi_multipass_instance(node),
      ),
    ]);
  } catch (e) {
    console.log(
      devStageAllLabel,
      ccolors.error("failed to stage 'dev' terraform resource"),
    );
    console.log(ccolors.caught(e, 80002));
    await emitExitEvent(80002);
    Deno.exit(80002);
  }
}
