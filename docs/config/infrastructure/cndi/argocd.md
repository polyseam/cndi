# `argocd`

## `infrastructure.cndi.argocd`

The `argocd` block is used to configure the
[ArgoCD](https://argoproj.github.io/argo-cd/) component of your cluster.

The only value which can be customized today is the `hostname` on which to make
it accessible. This element could easily be replaced by a simple
[Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
manifest in your `cluster_manifests` block and until recently it was included
there in our Templates, but we've given it a config key to save you from writing
out those details with every new cluster.

This shorthand requires that you have `external_dns` configured within `cndi` as
well so it can manage the DNS records for the `argo-server` Service and
[Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/).

If the hostname is absent we will not generate the Ingress resource for you and
you can handle it how you see fit.

Here is a minimal example of the `argocd` block:

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
    nodes: [...]
```

If the `cndi.argocd.hostname` property is provided we will generate the
[Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) for
you and it should be found at `./cndi/cluster_manifests/argo-ingress.yaml`
