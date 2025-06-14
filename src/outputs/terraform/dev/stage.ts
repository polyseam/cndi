import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import stageDevMicrok8sTerraformFiles from "./microk8s/stage.ts";

export default async function stageTerraformFilesForAWSEKS(
  cndi_config: NormalizedCNDIConfig,
) {
  return await stageDevMicrok8sTerraformFiles(cndi_config);
}
