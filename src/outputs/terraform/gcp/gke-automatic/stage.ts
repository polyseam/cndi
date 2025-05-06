import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";
import { ErrOut } from "errout";

const label = ccolors.faded(
  "\nsrc/outputs/terraform/gcp/gke-automatic/stage.ts:",
);

// deno-lint-ignore require-await
export async function stageGCPGKEAutopilotTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  return new ErrOut([
    ccolors.error("GKE Autopilot is still under construction!"),
  ], {
    code: -1,
    id: "GKE-Autopilot-Not-Implemented",
    label,
  });
}
