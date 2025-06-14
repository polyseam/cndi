import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

export function parseSubnetResourceId(networkResourceId: string) {
  // /subscriptions/16027ac8-8d35-45a5-9f0e-039ec792cfbe/resourceGroups/netconfig-insert-mode/providers/Microsoft.Network/virtualNetworks/insertion-target-vnet/subnets/my-subnet
  const [
    _leadingSlash,
    _subscriptions, // 'subscriptions'
    _subscription, // '123456'
    _resourceGroups, // 'resourceGroups'
    resourceGroupName, // 'my-rg'
    _providers, // 'providers'
    _provider, // 'Microsoft.Network'
    _virtualNetworks, // 'virtualNetworks'
    vnetName, // 'my-vnet'
    _subnets, // 'subnets'
    subnetName,
  ] = networkResourceId.split("/");

  if (!resourceGroupName || !vnetName || !subnetName) {
    throw new Error(`Invalid network resource id: ${networkResourceId}`);
  }

  return { resourceGroupName, vnetName, subnetName };
}

export function getNodeResourceGroupName(
  { project_name }: NormalizedCNDIConfig,
) {
  return `nrg-cndi-${project_name}`;
}
