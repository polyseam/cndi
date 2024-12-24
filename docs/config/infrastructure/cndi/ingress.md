# `ingress`

## `cndi.infrastructure.ingress`

The `ingress` block is used to configure the
[NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
component of your cluster.

### `cndi.infrastructure.ingress.public`

By default `cndi` will deploy a public ingress controller within the
`public-ingress` namespace, and used to provide public endpoints for your
applications. If you need to customize the `public` ingress controller, you can
do so by passing in `values` here. The `ingressClassName` for this ingress is
`"public"`.

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    ingress:
      public:
        enabled: true # default
    # values: {...} if required
    nodes: [...]
```

### `cndi.infrastructure.ingress.private`

By default `cndi` will **not** deploy a private ingress controller. To enable
the deployment of a `private` ingress controller, it should be enabled in your
config:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    ingress:
      private:
        enabled: true
        # values: {...} if required
      public:
        enabled: false
    nodes: [...]
```

The `ingressClassName` for this ingress is `"private"`.
