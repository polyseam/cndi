# cndi_config

The `cndi_config.yaml` file is the core of your CNDI project. It is a YAML file
that contains all the information about your project, including the the
`infrastructure` resources you need, the `applications` you want to deploy, and
the Kubernetes `cluster_manifests` which configure your cluster.

This one file is the key to understanding CNDI, it's pretty simple, lets step
through it.

This first block of config shows CNDI's metadata fields at the top.

We select a `provider` first, this time we are using `aws`, and then we select
the `distribution`, in this instance AWS' proprietary Kubernetes engine `eks`.

CNDI will use the provider and distribution to determine which Stack to deploy,
including a group of 3 Kubernetes cluster nodes with a provided `instance_type`
of
[t3.medium](https://instances.vantage.sh/?region=us-east-2&cost_duration=monthly&selected=t3.medium)
which specifies the hardware spec of the nodes.

```yaml
project_name: my-postgres-project
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    nodes:
      - name: postgres-nodes
        count: 3
        instance_type: t3.medium
```

By running this configuration, CNDI will deploy a Kubernetes cluster with 3
nodes on EKS including some platform features, but on it's own won't do very
much!

The next step is to configure the `applications` you want to deploy. In the
block below we are defining a new Application called `cnpg` which is a Cloud
Native PostgreSQL cluster.

Applications in CNDI are provided by Helm Charts, and generally you can find
their source by lookng at the `index.yaml` file available at the `repoURL`
provided.

For example, if we take the `repoURL` from the block below and append
`/index.yaml` to it, we can visit that file and find the element of the
`entries` object where the key is our `chart` (cloudnative-pg), and the
`version` field matches our `targetRevision` (0.18.0).

[https://cloudnative-pg.github.io/charts/index.yaml](https://cloudnative-pg.github.io/charts/index.yaml)

```yaml
project_name: my-postgres-project
cndi_version: v2
provider: aws
distribution: eks
infrastructure: {...}
applications:
  cnpg:
    targetRevision: 0.18.0
    destinationNamespace: cnpg-system
    repoURL: "https://cloudnative-pg.github.io/charts"
    chart: cloudnative-pg
    values: {}
```
