import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { ErrOut } from "errout";

// TODO: Implement GCP/Azure specific implementation
export function stageGCPGKEClassicNetworkModeInsertTerraformFiles(
  _cndi_config: NormalizedCNDIConfig,
): Promise<ErrOut | null> {
  throw new ErrOut([
    "GCP/Azure specific implementation not implemented yet",
  ], {
    code: -1,
    id: "gcp-azure-specific-implementation-not-implemented-yet",
    label: "src/outputs/terraform/gcp/gke/classic/network-mode-insert/stage.ts",
  });
}
