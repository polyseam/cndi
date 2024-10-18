# cndi_config

## metadata

The `cndi_config.yaml` file is the core of your CNDI project. It is a YAML file
that contains all the information about your project, including the the
`infrastructure` resources you need, the `applications` you want to deploy, and
the Kubernetes `cluster_manifests` which configure your cluster.

This one file is the key to understanding CNDI, it's pretty simple, lets step
through it.

This first block of config shows CNDI's metadata fields at the top.

We select a `provider` first, this time we are using `aws`, and then we select
the `distribution`, in this instance AWS' proprietary Kubernetes engine `eks`.
Generally most CNDI projects are Kubernetes clusters, though there can be some
exceptions if the goal is to deploy some other type of infrastructure.

## infrastructure

CNDI will use the `provider` and `distribution` to determine which Stack to
deploy, including a group of 3 Kubernetes cluster nodes with a provided
`instance_type` of
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
nodes on [EKS](https://aws.amazon.com/eks/) including some platform features,
but on it's own won't do very much!

## applications

The next step is to configure the `applications` you want to deploy. In the
block below we are defining a new Application called `cnpg` which is a Cloud
Native PostgreSQL cluster.

Applications in CNDI are provided by [Helm](https://helm.sh) Charts, and
generally you can find their source by lookng at the `index.yaml` file available
at the `repoURL` provided.

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
infrastructure: { ... }
applications:
  cnpg:
    targetRevision: 0.18.0
    destinationNamespace: cnpg-system
    repoURL: "https://cloudnative-pg.github.io/charts"
    chart: cloudnative-pg
    values: {}
```

Now we're getting somewhere! This block will deploy the cloudnative-pg operator,
which will now be on the lookout for a new Kubernetes manifest which requests a
new PostgreSQL cluster.

This is called the "Operator Pattern". Rather than configure a database directly
in the `values` section of the `cnpg` Application, we will create a cluster
'manifest' to configure it instead.

## cluster_manifests

This next block of config shows the `cluster_manifests` section of
`cndi_config.yaml`. It includes all of the configuration for our cluster,
sometimes built-in Kubernetes-native resources and other times Custom Resources.

The 3 shown below are a
[Namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/),
a [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) (with some
CNDI magic), and the "Custom Resource" cloudnative-pg's
[Cluster](https://cloudnative-pg.io/documentation/1.22/cloudnative-pg.v1/#postgresql-cnpg-io-v1-Cluster),
which the cloudnative-pg operator will watch for.

```yaml
project_name: my-postgres-project
cndi_version: v2
provider: aws
distribution: eks
infrastructure: { ... }
applications: { ... }
cluster_manifests:
  # keys are arbitrary and used as file names
  # eg. ./cndi/cluster_manifests/pg-namespace.yaml
  pg-namespace: # a simple Kubernetes manifest which enables the grouping of resources
    apiVersion: v1
    kind: Namespace
    metadata:
      name: cnpg

  pg-cluster:
    apiVersion: postgresql.cnpg.io/v1
    kind: "Cluster" # the kind of custom resource that the cloudnative-pg operator will watch for
    metadata:
      name: "my-postgres-cluster"
      namespace: "cnpg"
    spec:
      replicas: 1
      storageSize: 10Gi

  cnpg-cluster-superuser-auth-secret:
    # a Kubernetes Secret resource, which will hold PostgreSQL superuser credentials
    apiVersion: v1
    kind: Secret
    metadata:
      name: cnpg-cluster-superuser-auth-secret
      namespace: cnpg
    type: kubernetes.io/basic-auth
    stringData:
      # below is a CNDI 'macro' which securely encrypts these values from '.env'
      username: $cndi_on_ow.seal_secret_from_env_var(POSTGRESQL_CLUSTER_SUPERUSER)
      password: $cndi_on_ow.seal_secret_from_env_var(POSTGRESQL_PASSWORD)
```

## tl;dr

We recommend understanding broadly how elements of your `cndi_config.yaml` fit
in to your project, and then diving into the specifics of each element as you
need to change them.

Templates are meant to provide optimal configuration in the general case right
out-of-the-box, when you need to customize things you can dig deeper.
