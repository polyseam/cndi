import { CNDIConfig } from "src/types.ts";
import { ccolors } from "deps";
import { ErrOut } from "errout";

// TODO: AWS Clusterless

const label = ccolors.faded(
  "\nsrc/outputs/terraform/aws/clusterless/stage.ts:",
);

// deno-lint-ignore require-await
export async function stageAWSClusterlessTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  return new ErrOut([
    ccolors.error("AWS Clusterless is still under construction!"),
  ], {
    code: -1,
    id: "AWS-Clusterless-Not-Implemented",
    label,
  });
}
