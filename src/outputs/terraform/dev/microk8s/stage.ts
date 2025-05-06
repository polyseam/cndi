import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";
import { ErrOut } from "errout";

// TODO: Dev Microk8s

const label = ccolors.faded(
  "\nsrc/outputs/terraform/dev/microk8s/stage.ts:",
);

// deno-lint-ignore require-await
export async function stageDevMicrok8sTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  return new ErrOut([
    ccolors.error("Dev Microk8s is still under construction!"),
  ], {
    code: -1,
    id: "Dev-Microk8s-Not-Implemented",
    label,
  });
}
