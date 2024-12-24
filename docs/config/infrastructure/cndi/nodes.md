# `nodes`

## `cndi.infrastructure.nodes`

The `nodes` block is used to configure the nodes your cluster will run on. Each
node can be customized with:

- `name`: the name of the node group to create
- `count`: the number of nodes to create in the group
- `instance_type`: the sku of each instance according to the cloud provider
- `disk_size`: size of disk in GB which will be attached to each node
- `labels`: a map of key-value pairs to apply as labels to each node
- `taints`: a list of taints to apply to each node, see configuration below

Here is a minimal example of the `nodes` block:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    nodes:
      - name: my-node-group
        count: 3
        instance_type: t3.medium
        disk_size: 100
        # labels:
        #   foo: bar
        # taints:
        #   - key: "dedicated"
        #     value: "special"
        #     effect: "NoSchedule"
```

To learn more about the available `instance_type` options for each cloud
provider we recommend:

### aws

[https://instances.vantage.sh](https://instances.vantage.sh)

### azure

[https://instances.vantage.sh/azure](https://instances.vantage.sh/azure)

### gcp

[https://cloud.google.com/compute/vm-instance-pricing](https://cloud.google.com/compute/vm-instance-pricing)
