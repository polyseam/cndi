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
      return ["azurerm_kubernetes_cluster.cndi_azure_kubernetes_cluster"];
    default:
      return [];
  }
}
