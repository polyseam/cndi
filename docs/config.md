# cndi_config.yaml

The `cndi_config.yaml` file is the core of your CNDI project. It is a YAML file
that contains all the information about your project, including the the
`infrastructure` resources you need, the `applications` you want to deploy, and
the Kubernetes `cluster_manifests` which configure your cluster.

The entire schema for this config file is defined at
[./src/schemas/cndi_config.schema.json](/src/schemas/cndi_config.schema.json)
and should be up-to-date with the latest version of CNDI.

This one file is the key to understanding CNDI, it's pretty simple, lets step
through it.

## metadata

This first block of config shows CNDI's metadata fields at the top.

- `cndi_version` is the version of CNDI you are using. This is used to determine
  how we should parse your config, and which schema to validate against. In
  practice `v2` is the only version available today.

- `project_name` is a human-readable name for your project. It can be used to
  create infrastructure tags, and is generally expected to be unique per cloud
  environment.

- `provider` is the cloud provider you are using. This is used to determine
  which cloud provider's API to use.

- `distribution` is the Kubernetes distribution you are using. This is used to
  determine which Kubernetes distribution's API to use.

- `region` is the region to be used in your target provider

Here's an example with those values configured:

```yaml
cndi_version: v3
project_name: my-cndi-project
provider: aws
distribution: eks
region: us-east-1
```

## `infrastructure`

The next block of config shows the `infrastructure` section of
`cndi_config.yaml`. This generally includes the `cndi` key, and also rarely
includes the `terraform` key if you need to deploy resources from Terraform not
covered by the `cndi` key.

### `terraform`

The `terraform` key is used to deploy resources using Terraform beyond what
`cndi` was built to handle. This is generally used for more complex
infrastructure requirements and should be considered an "escape hatch" for when
`cndi` doesn't cover your use case. For more information on how to use this key
check out the dedicated
[infrastructure.terraform](config/infrastructure/terraform.md) documentation.

### `cndi`

The `cndi` key contains a number of in-built modules which can be used to
configure both Kubernetes objects and some cloud resources.

The most common of these is the `nodes` key, which is used to configure the
Kubernetes nodes in your cluster.

Let's look at a quick basic example:

CNDI will use the `provider` and `distribution` to determine which Stack to
deploy, including a group of 3 Kubernetes cluster nodes with a provided
`instance_type` of
[t3.medium](https://instances.vantage.sh/?region=us-east-2&cost_duration=monthly&selected=t3.medium)
which specifies the hardware spec of the nodes.

```yaml
project_name: my-postgres-project
cndi_version: v3
provider: aws
distribution: eks
region: us-east-1
infrastructure:
  cndi:
    nodes:
      - name: postgres-nodes
        count: 3
        instance_type: t3.medium
```

By running this configuration, CNDI will deploy a Kubernetes cluster with 3
nodes on [EKS](https://aws.amazon.com/eks/) including some platform features,
but on it's own won't do very much without [applications](#applications).

But before moving on, let's also list all built-in modules which can be used in
the `infrastructure.cndi` block:

| `infrastructure.cndi.`                                         | Description                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`nodes`](config/infrastructure/cndi/nodes.md)                 | Configure Cluster Nodes                                                |
| [`cert_manager`](config/infrastructure/cndi/cert_manager.md)   | Configure Cert-Manager for your Cluster                                |
| [`external_dns`](config/infrastructure/cndi/external_dns.md)   | Configure ExternalDNS to create DNS records for your Ingress resources |
| [`argocd`](config/infrastructure/cndi/argocd.md)               | Configure ArgoCD for your Cluster                                      |
| [`observability`](config/infrastructure/cndi/observability.md) | Configure Observability stack                                          |
| [`network`](config/infrastructure/cndi/network.md)             | Configure Cluster Networking                                           |
| [`functions`](config/infrastructure/cndi/functions.md)         | Build and Deploy Custom CNDI Functions                                 |

This document will summarize typical usage for each of these properties, and for
more detailed information you can refer to documentation page for each.

## `applications`

The next block of config shows the `applications` section of `cndi_config.yaml`.
This section of the config is a thin wrapper over the ArgoCD
[Application CRD](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/#applications),
and is used to deploy applications to your cluster. Here's an example of the
`applications` block in action:

```yaml
# metadata
project_name: wordpress-project
cndi_version: v2
provider: azure
distribution: aks

# infrastructure
infrastructure: { ... }

# applications
applications:
  wordpress:
    repoURL: https://charts.bitnami.com/bitnami
    chart: wordpress
    targetRevision: 23.1.17
    destinationNamespace: wordpress
    values:
      existingSecret: wordpress-pw
      wordpressUsername: admin
```

This block will deploy the `wordpress` the chart named `"wordpress"` found in
the `https://charts.bitnami.com/bitnami` helm repository, with version
`23.1.17`. The chart will be deployed to the `wordpress` namespace, and the
`values` block will be passed to the chart as a `values.yaml` file.

For more information on how to configure applications, see the
[applications](config/applications.md) documentation.

## `cluster_manifests`

The `cluster_manifests` section is used to define Kubernetes resources which
should be added to your cluster. This can be used to configure your cluster in
ways that are not covered by the `infrastructure` or `applications` sections.

Generally this works by taking the key of the object in the `cluster_manifests`
block, and writing a Kubernetes manifest in a file with that name in the
`cndi/cluster_manifests` directory, with a `.yaml` extension.

Here's a simple example of the `cluster_manifests` block in action:

```yaml
cluster_manifests:
  valid-simple-ns: # will be written to ./cndi/cluster_manifests/valid-simple-ns.yaml
    apiVersion: v1
    kind: Namespace
    metadata:
      name: simple-ns
```

The only time the input `cluster_manifests` entries are transformed is when they
have the `Secret` kind.

When the manifest contains `Secret.data` or `Secret.stringData` defined in
plain-text, they will not be written out to `./cndi/cluster_manifests`. Instead,
you can use the `cndi_on_ow.seal_secret_from_env_var(MY_VAR)` function to
securely encrypt these values from your `.env` file (or environment).

```yaml
cluster_manifests:
  valid-simple-ns:
    apiVersion: v1
    kind: Namespace
    metadata:
      name: simple-ns
  bad-secret: # invalid, CNDI will not write this to ./cndi/cluster_manifests
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-user-secret
      namespace: foo
    stringData:
      username: admin
      password: password123

  valid-secret:
    # valid! CNDI will write this to ./cndi/cluster_manifests as a SealedSecret
    # you can trust the real Secret will be available in your cluster safely
    # without putting the plain-text values in git
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-user-secret
      namespace: foo
    stringData:
      username: $cndi_on_ow.seal_secret_from_env_var(MY_USERNAME)
      password: $cndi_on_ow.seal_secret_from_env_var(MY_PASSWORD)
```

For more information on how to configure `cluster_manifests`, see the
[cluster_manifests](config/cluster_manifests.md) documentation.

# Conclusion

Now that you've had a high-level overview of the `cndi_config.yaml` file, you
may be interested in the other parameters you can customize at a deeper level.

Every section of a `cndi_config.yaml` file is documented more thoroughly in the
[./docs/config](/docs/config) directory, including:

- [applications](config/applications.md)
- [cluster_manifests](config/cluster_manifests.md)
- [infrastructure.cndi.nodes](config/infrastructure/cndi/nodes.md)
- [infrastructure.cndi.cert_manager](config/infrastructure/cndi/cert_manager.md)
- [infrastructure.cndi.argocd](config/infrastructure/cndi/argocd.md)
- [infrastructure.cndi.external_dns](config/infrastructure/cndi/external_dns.md)
- [infrastructure.cndi.functions](config/infrastructure/cndi/functions.md)
- [infrastructure.cndi.network](config/infrastructure/cndi/network.md)
- [infrastructure.cndi.observability](config/infrastructure/cndi/observability.md)
- [infrastructure.terraform](config/infrastructure.md)

Additionally, here is an example of a typical `cndi_config.yaml` file:

```yaml
project_name: wordpress-cluster
cndi_version: v2
provider: azure
distribution: aks

infrastructure:
  cndi:
    nodes: # ./docs/config/infrastructure/cndi/nodes.md
      - name: wordpress-nodes
        count: 3
        instance_type: Standard_D2_v2
    cert_manager: # ./docs/config/infrastructure/cndi/cert_manager.md
      email: jane.smith@example.com
    external_dns:
      provider: azure
    argocd: # ./docs/config/infrastructure/cndi/argocd.md
      hostname: argocd.my-cluster.example.com
    observability: # ./docs/config/infrastructure/cndi/observability.md
      grafana:
        hostname: observability.my-cluster.example.com

cluster_manifests: # ./docs/config/cluster_manifests.md
  wordpress-ingress: # https://kubernetes.io/docs/concepts/services-networking/ingress/
    wp-ingress:
    kind: Ingress
    apiVersion: networking.k8s.io/v1
    metadata:
      name: wordpress-ingress
      namespace: wordpress
      annotations:
        cert-manager.io/cluster-issuer: cluster-issuer
        kubernetes.io/tls-acme: "true"
        nginx.ingress.kubernetes.io/backend-protocol: HTTPS
        external-dns.alpha.kubernetes.io/hostname: wordpress.my-cluster.example.com
    spec:
      ingressClassName: public
      tls:
        - hosts:
            - wordpress.my-cluster.example.com
          secretName: cluster-issuer-private-key
      rules:
        - host: wordpress.my-cluster.example.com
          http:
            paths:
              - path: /
                pathType: ImplementationSpecific
                backend:
                  service:
                    name: wordpress
                    port:
                      number: 443

  wordpress-secret: # https://kubernetes.io/docs/concepts/configuration/secret/
    apiVersion: v1
    kind: Secret
    metadata:
      name: wordpress-pw
      namespace: wordpress
    stringData:
      wordpress-password: $cndi_on_ow.seal_secret_from_env_var(WORDPRESS_PASSWORD)

  wordpress-ns: # https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/
    apiVersion: v1
    kind: Namespace
    metadata:
      name: wordpress

  external-dns-secret: # https://kubernetes.io/docs/concepts/configuration/secret/
    apiVersion: v1
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
    stringData:
      # credentials in JSON string in .env used to modify DNS records
      azure.json: $cndi_on_ow.seal_secret_from_env_var(AZURE_CREDENTIALS)

applications: # ./docs/config/applications.md
  wordpress:
    repoURL: https://charts.bitnami.com/bitnami
    chart: wordpress
    targetRevision: 23.1.17
    destinationNamespace: wordpress
    values:
      existingSecret: wordpress-pw
      wordpressUsername: admin
```
