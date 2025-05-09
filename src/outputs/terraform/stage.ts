import { ccolors } from "deps";
import { CNDIConfig, CNDIProvider } from "src/types.ts";

import aws from "./aws/stage.ts";
import gcp from "./gcp/stage.ts";
import azure from "./azure/stage.ts";
import dev from "./dev/stage.ts";

import { ErrOut } from "errout";

import { processAndStageTerraformPassthru } from "./passthru.ts";

const _label = ccolors.faded(
  "src/outputs/terraform/stage.ts:",
);

type Stagers = {
  [key in CNDIProvider]: (cndi_config: CNDIConfig) => Promise<null | ErrOut>;
};

const stagers: Stagers = {
  aws,
  gcp,
  azure,
  dev,
};

export default async function stageTerraformFiles(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const err = await stagers[cndi_config.provider](cndi_config);

  if (err) return err;

  const errPassthru = await processAndStageTerraformPassthru(cndi_config);

  if (errPassthru) return errPassthru;

  return null;
}

// if (distribution === "microk8s") {
//   const errStagingLeaderCloudInit = await stageFile(
//     path.join("cndi", "terraform", "microk8s-cloud-init-leader.yml.tftpl"),
//     microk8sCloudInitLeaderTerraformTemplate(config, {
//       useSshRepoAuth: useSshRepoAuth(),
//       useClusterHA: config.infrastructure.cndi.nodes.length > 2,
//     }),
//   );
//   if (errStagingLeaderCloudInit) {
//     return errStagingLeaderCloudInit;
//   }
//   const errStagingFollowerCloudInit = await stageFile(
//     path.join("cndi", "terraform", "microk8s-cloud-init-worker.yml.tftpl"),
//     microk8sCloudInitFollowerTerraformTemplate(config, { isWorker: true }),
//   );
//   if (errStagingFollowerCloudInit) {
//     return errStagingFollowerCloudInit;
//   }
// }
// return errStagingStack;
