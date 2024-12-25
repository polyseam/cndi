# `external_dns`

## `infrastructure.cndi.external_dns`

[ExternalDNS](https://github.com/bitnami/charts/blob/main/bitnami/external-dns/README.md)
is used to enable Kubernetes to create and update DNS records corresponding to
Ingress resources. This is useful for creating a public endpoint for your
applications.

The `external_dns` block is used to configure the
[ExternalDNS](https://github.com/bitnami/charts/blob/main/bitnami/external-dns/README.md)
controller. The only value which must be set is the `provider` key.

By default ExternalDNS will also look for a secret named `external-dns` and in
the `external-dns` namespace which must grant access to whichever DNS provider
you want synchronized.

By default CNDI Templates will assume that your DNS `provider` is in the same
cloud as your cluster, and will use the same credentials as your cluster. If you
need to customize the `domainFilter` key, you can do so here.

The following example show's that if you are using
[Route53](https://aws.amazon.com/route53/) with an
[EKS](https://aws.amazon.com/eks/) cluster, your `external-dns` Secret will be
configured with the same `AWS_SECRET_ACCESS_KEY` and `AWS_ACCESS_KEY_ID` as your
cluster itself.

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    external_dns:
      provider: aws
      # values: {...} if required
    nodes: [...]
cluster_manifests:
  external-dns-secret:
    apiVersion: v1
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
    stringData:
      AWS_ACCESS_KEY_ID: $cndi_on_ow.seal_secret_from_env_var(AWS_ACCESS_KEY_ID)
      AWS_SECRET_ACCESS_KEY: $cndi_on_ow.seal_secret_from_env_var(AWS_SECRET_ACCESS_KEY)
```

If you need to further customize the ExternalDNS configuration you can modify
the `provider` and `Secret` data, or even provide a `values` block to override
the default
[values - as documented here](https://github.com/bitnami/charts/blob/main/bitnami/external-dns/values.yaml).