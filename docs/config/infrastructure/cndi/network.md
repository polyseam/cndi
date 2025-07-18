# network

## `infrastructure.cndi.network`

CNDI supports two modes for deploying your cluster:

- `create`: CNDI will create a new VNet and subnet for your cluster.
- `insert`: CNDI will insert your cluster into an existing VNet.

The default mode is `create` and this is the most stable configuration because
it doesn't rely on your VNet being configured in any particular way.

## `create` mode 🖌️

When using `create` mode, CNDI will create a new VNet and one or more subnets
for your cluster depending on your deployment target. By default the new virtual
network also known as your VPC will be created using the `10.0.0.0/16` address
space.

If you want to specify a different address space, you can do so by setting the
`network_address_space` and `subnet_addres_spaces` properties in your
`cndi_config.yaml` file like so:

```yaml
infrastructure:
  cndi:
    network: # all optional!
      mode: create
      network_address_space: 10.0.0.0/16
      subnet_address_spaces:
        private:
          - 10.0.0.0/18
          - 10.0.64.0/18
        public:
          - 10.0.128.0/18
          - 10.0.192.0/18
```

## `insert` mode 🛠️

When using `insert` mode, CNDI will insert your cluster into an existing VNet.
This is useful if the cluster will be communicating with some pre-existing
infrastructure and should be kept close.

To use `insert` mode, you need to specify the `network_identifier` in your
`cndi_config.yaml` file. You can also optionally specify the
`subnet_identifiers` to be used for the new subnets we will use for your
cluster.

```yaml
infrastructure:
  cndi:
    network:
      mode: insert
      # AWS:
      network_identifier: vpc-0a1b2c3d4e5f6g7h8 # required in insert mode
      subnet_identifiers: # at least one subnet required in insert mode
        public:
          - subnet-a261b25c24
        private:
          - subnet-t4395jtg33
      # Azure:
      # network_identifier: /subscriptions/.../resourceGroups/my-rg/providers/Microsoft.Network/virtualNetworks/my-vnet
      # GCP:
      # network_identifier: my-network
```
