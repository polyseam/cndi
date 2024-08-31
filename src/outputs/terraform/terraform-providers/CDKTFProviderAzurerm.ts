import {
  kubernetesCluster,
  kubernetesClusterNodePool,
  provider,
  resourceGroup,
  subnet,
  virtualNetwork,
} from "@cdktf/provider-azurerm";

export const CDKTFProviderAzurerm = {
  provider,
  resourceGroup,
  kubernetesClusterNodePool,
  virtualNetwork,
  subnet,
  kubernetesCluster,
};
