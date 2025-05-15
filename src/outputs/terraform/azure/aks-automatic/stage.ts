import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";

// import {
//   stageFile,
//   useSshRepoAuth,
// } from "src/utils.ts";

// import getDataTfJSON from "./data.tf.json.ts";

import { ErrOut } from "errout";

const label = ccolors.faded(
  "\nsrc/outputs/terraform/azure/aks-automatic/stage.ts:\n",
);

// deno-lint-ignore require-await
export async function stageAzureAKSAutomaticTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  return new ErrOut([
    ccolors.error("AKS Automatic is still under construction!"),
  ], {
    code: -1,
    id: "AKS-Automatic-Not-Implemented",
    label,
  });
}
