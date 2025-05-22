import { CNDIConfig } from "src/types.ts";

export function getDependsOnForClusterWithCNDIConfig(
  cndi_config: CNDIConfig,
): string[] {
  switch (cndi_config.provider) {
    case "gcp":
      return ["google_container_cluster.cndi_google_container_cluster"];
    case "aws":
      return ["aws_eks_cluster.cndi_aws_eks_cluster"];
    case "azure":
      return ["azurerm_kubernetes_cluster.cndi_azure_kubernetes_cluster"];
    default:
      return [];
  }
}
