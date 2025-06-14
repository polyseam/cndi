import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageAzureAKSClassicNetworkModeInsertTerraformFiles } from "./classic/network-mode-insert/stage.ts";
import { stageAzureAKSClassicNetworkModeCreateTerraformFiles } from "./classic/network-mode-create/stage.ts";

import { ErrOut } from "errout";

export async function stageAzureAKSTerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const mode = cndi_config?.infrastructure?.cndi?.network?.mode;
  if (mode === "insert") {
    return await stageAzureAKSClassicNetworkModeInsertTerraformFiles(
      cndi_config,
    );
  }
  return await stageAzureAKSClassicNetworkModeCreateTerraformFiles(cndi_config);
}
