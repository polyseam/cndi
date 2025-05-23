import { CNDIConfig } from "src/types.ts";

export function getDependsOnForClusterWithCNDIConfig(
  cndi_config: CNDIConfig,
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
