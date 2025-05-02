import { CNDIConfig } from "src/types.ts";
import { stageAWSEKSClassicTerraformFiles } from "./eks-classic/stage.ts";
import { stageAWSEKSAutomaticTerraformFiles } from "./eks-automatic/stage.ts";

const useEKSAutomatic = (
  cndi_config: CNDIConfig,
) => (cndi_config?.infrastructure?.cndi?.nodes as unknown === "automatic");

export default async function stageTerraformFilesForAWSEKS(
  cndi_config: CNDIConfig,
) {
  if (useEKSAutomatic(cndi_config)) {
    return await stageAWSEKSAutomaticTerraformFiles(cndi_config);
  }
  return await stageAWSEKSClassicTerraformFiles(cndi_config);
}
