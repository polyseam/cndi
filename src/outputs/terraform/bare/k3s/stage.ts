import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageK3sClassicTerraform } from "./insert/stage.ts";
import { ErrOut } from "errout";

/**
 * Stages Terraform files for k3s distribution (bare provider)
 */
export async function stageBareK3sTerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  // For now, we only support the classic k3s deployment.
  // In the future we may add other k3s deployment modes here.
  return await stageK3sClassicTerraform(cndi_config);
}
