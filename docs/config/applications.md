# `applications`

`applications` entries in CNDI are provided by [Helm](https://helm.sh) Charts,
and generally you can find their source by lookng at the `index.yaml` file
available at the `repoURL` provided.

For example, if we take the `repoURL` from the block below and append
`/index.yaml` to it, we can visit that file and find the element of the
`entries` object where the key is our `chart` (`"wordpress"`), and the `version`
field matches our `targetRevision` (23.1.17).

[https://charts.bitnami.com/bitnami/index.yaml](hhttps://charts.bitnami.com/bitnami/index.yaml)

```yaml
project_name: my-postgres-project
cndi_version: v2
provider: aws
distribution: eks
infrastructure: { ... }
cluster_manifests: { ... }
applications:
  wordpress:
    repoURL: https://charts.bitnami.com/bitnami
    chart: wordpress
    targetRevision: 23.1.17
    destinationNamespace: wordpress
    values:
      wordpressUsername: admin
      existingSecret: wordpress-pw
```

This block will deploy the `wordpress` Helm Chart from the `bitnami` repository,
customizing it with values. The first value is `wordpressUsername` which will be
set to `admin`, and the second value is `existingSecret` which will be set to
`wordpress-pw`. The `wordpress-pw` secret must exist in the `wordpress`
namespace, so we need to make sure it is present in our
[cluster_manifests](/docs/cluster_manifests.md) section.
