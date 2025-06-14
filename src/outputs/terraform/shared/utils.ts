import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

export function getDependsOnForClusterWithCNDIConfig(
  cndi_config: NormalizedCNDIConfig,
): string[] {
  switch (cndi_config.provider) {
    case "gcp":
      return ["module.cndi_gcp_gke_module"];
    case "aws":
      return ["module.cndi_aws_eks_module"];
    case "azure":
      return ["module.cndi_azurerm_aks_module"];
    default:
      return [];
  }
}
