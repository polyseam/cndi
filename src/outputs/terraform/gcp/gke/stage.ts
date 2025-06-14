import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageGCPGKEClassicNetworkModeInsertTerraformFiles } from "./classic/network-mode-insert/stage.ts";
import { stageGCPGKEClassicNetworkModeCreateTerraformFiles } from "./classic/network-mode-create/stage.ts";

import { ErrOut } from "errout";

export async function stageGCPGKETerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const mode = cndi_config?.infrastructure?.cndi?.network?.mode;
  if (mode === "insert") {
    return await stageGCPGKEClassicNetworkModeInsertTerraformFiles(cndi_config);
  }
  return await stageGCPGKEClassicNetworkModeCreateTerraformFiles(cndi_config);
}
