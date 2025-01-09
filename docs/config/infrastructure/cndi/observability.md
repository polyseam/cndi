# `observability`

## `infrastructure.cndi.observability`

The next feature defined in the `infrastructure.cndi` block is `observability`.
Observability is enabled by default and can be disabled or customized. The
out-of-the-box configuration uses `kube-prometheus-stack`, `loki`, and
`promtail`. To customize the `hostname` on which to expose Grafana, use the
following:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    external_dns:
      provider: aws
    argocd:
      hostname: argocd.my-cluster.example.com
    observability:
      # enabled: true (default)
      grafana:
        hostname: observability.my-cluster.example.com
  nodes: [...]
```

If you need to further customize the observability stack, you can provide a
`values` block to override the default chart values as follows:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    observability:
      kube_prometheus_stack:
        values: { ... }
      loki:
        values: { ... }
      promtail:
        values: { ... }

    nodes: [...]
```

Or you can completely disable the `observability` stack as follows:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    observability:
      enabled: false
    nodes: [...]
```
