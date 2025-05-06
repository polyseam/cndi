import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";
import { ErrOut } from "errout";

// TODO: GCP Clusterless

const label = ccolors.faded(
  "\nsrc/outputs/terraform/gcp/clusterless/stage.ts:",
);

// deno-lint-ignore require-await
export async function stageGCPClusterlessTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  return new ErrOut([
    ccolors.error("GCP Clusterless is still under construction!"),
  ], {
    code: -1,
    id: "GCP-Clusterless-Autopilot-Not-Implemented",
    label,
  });
}
