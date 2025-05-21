import { CNDIConfig } from "src/types.ts";
import { ErrOut } from "errout";

// TODO: Implement GCP/Azure specific implementation
export function stageAzureAKSClassicNetworkModeInsertTerraformFiles(
  _cndi_config: CNDIConfig,
): Promise<ErrOut | null> {
  throw new ErrOut([
    "GCP/Azure specific implementation not implemented yet",
  ], {
    code: -1,
    id: "gcp-azure-specific-implementation-not-implemented-yet",
    label:
      "src/outputs/terraform/azure/aks/classic/network-mode-insert/stage.ts",
  });
}
