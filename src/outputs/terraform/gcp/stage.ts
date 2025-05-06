import { CNDIConfig } from "src/types.ts";
import { stageGCPGKEClassicTerraformFiles } from "./gke-classic/stage.ts";
import { stageGCPGKEAutopilotTerraformFiles } from "./gke-automatic/stage.ts";

const useGCPAutopilot = (
  cndi_config: CNDIConfig,
) => (cndi_config?.infrastructure?.cndi?.nodes as unknown === "automatic");

export default async function stageTerraformFilesForAWSGKE(
  cndi_config: CNDIConfig,
) {
  if (useGCPAutopilot(cndi_config)) {
    return await stageGCPGKEAutopilotTerraformFiles(cndi_config);
  }
  return await stageGCPGKEClassicTerraformFiles(cndi_config);
}

