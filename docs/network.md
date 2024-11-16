# cndi network configuration 🔌

> [!NOTE]
> We're going to use the term VNet to refer to the concept of a virtual network.
> AWS calls this a VPC, Azure calls this a VNet, and GCP calls this a Compute
> Network.

CNDI supports two modes for deploying your cluster:

- `create`: CNDI will create a new VNet and subnet for your cluster.
- `insert`: CNDI will insert your cluster into an existing VNet.

The default mode is `create` and this is the most stable configuration because
it doesn't rely on your VNet being configured in any particular way.

## `create` mode 🖌️

When using `create` mode, CNDI will create a new VNet and one or more subnets
for your cluster depending on your deployment target. By default the new virtual
network also known as VNet will be created using the `10.0.0.0/16` address
space.

If you want to specify a different address space, you can do so by setting the
`vnet_address_space` property in your `cndi_config.yaml` file like so:

```yaml
infrastructure:
  cndi:
    network:
      vnet_address_space: 10.1.0.0/16
```

## `insert` mode 🛠️

When using `insert` mode, CNDI will insert your cluster into an existing VNet.
This is useful if the cluster will be communicating with some pre-existing
infrastructure and should be kept close.

To use `insert` mode, you need to specify the `vnet_identifier` in your
`cndi_config.yaml` file. You can also optionally specify the
`subnet_address_space` to be used for the new subnet we will create in the
target VNet.

```yaml
infrastructure:
  cndi:
    network:
      mode: insert
      # AWS:
      vnet_identifier: vpc-0a1b2c3d4e5f6g7h8
      # Azure:
      # vnet_identifier: /subscriptions/.../resourceGroups/my-rg/providers/Microsoft.Network/virtualNetworks/my-vnet
      # GCP:
      # vnet_identifier: my-network
```
