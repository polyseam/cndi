import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageAWSEKSClassicNetworkModeInsertTerraformFiles } from "./classic/network-mode-insert/stage.ts";
import { stageAWSEKSClassicNetworkModeCreateTerraformFiles } from "./classic/network-mode-create/stage.ts";

import { ErrOut } from "errout";

export async function stageAWSEKSTerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const mode = cndi_config?.infrastructure?.cndi?.network?.mode;
  if (mode === "insert") {
    return await stageAWSEKSClassicNetworkModeInsertTerraformFiles(cndi_config);
  }
  return await stageAWSEKSClassicNetworkModeCreateTerraformFiles(cndi_config);
}
