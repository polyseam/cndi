import { CNDIConfig } from "src/types.ts";
import stageDevMicrok8sTerraformFiles from "./microk8s/stage.ts";

export default async function stageTerraformFilesForAWSEKS(
  cndi_config: CNDIConfig,
) {
  return await stageDevMicrok8sTerraformFiles(cndi_config);
}
