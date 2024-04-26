export function parseNetworkResourceId(networkResourceId: string) {
  // /subscriptions/12345678/resourceGroups/my-rg/providers/Microsoft.Network/virtualNetworks/my-vnet
  const [
    _leadingSlash,
    _subscriptions, // 'subscriptions'
    _subscription, // '123456'
    _resourceGroups, // 'resourceGroups'
    resourceGroupName, // 'my-rg'
    _providers, // 'providers'
    _provider, // 'Microsoft.Network'
    _virtualNetworks, // 'virtualNetworks'
    virtualNetworkName, // 'my-vnet'
  ] = networkResourceId.split("/");

  if (!resourceGroupName || !virtualNetworkName) {
    throw new Error(`Invalid network resource id: ${networkResourceId}`);
  }

  return { resourceGroupName, virtualNetworkName };
}
