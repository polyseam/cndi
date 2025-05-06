import { CNDIConfig } from "src/types.ts";
import { stageAzureAKSClassicTerraformFiles } from "./aks-classic/stage.ts";
import { stageAzureAKSAutomaticTerraformFiles } from "./aks-automatic/stage.ts";

const useAKSAutomatic = (
  cndi_config: CNDIConfig,
) => (cndi_config?.infrastructure?.cndi?.nodes as unknown === "automatic");

export default async function stageTerraformFilesForAzureAKS(
  cndi_config: CNDIConfig,
) {
  if (useAKSAutomatic(cndi_config)) {
    return await stageAzureAKSAutomaticTerraformFiles(cndi_config);
  }
  return await stageAzureAKSClassicTerraformFiles(cndi_config);
}
