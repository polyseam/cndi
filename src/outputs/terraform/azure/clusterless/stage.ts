import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";
import { ErrOut } from "errout";

// TODO: Azure Clusterless

const label = ccolors.faded(
  "\nsrc/outputs/terraform/azure/clusterless/stage.ts:",
);

// deno-lint-ignore require-await
export async function stageAzureClusterlessTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  return new ErrOut([
    ccolors.error("Azure Clusterless is still under construction!"),
  ], {
    code: -1,
    id: "Azure-Clusterless-Not-Implemented",
    label,
  });
}
