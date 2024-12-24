# `cluster_manifests`

The `cluster_manifests` section of the `cndi_config.yaml` file is where you can
define Kubernetes manifests that will be applied by ArgoCD in your new cluster
when it is up and running.

Specifically, the `cluster_manifests` section is a dictionary where the key is
the name of the manifest file and the value is the content of the manifest. The
content of the manifest should be a valid Kubernetes manifest in YAML format.

Everytime `cndi ow` is executed, the contents of the dictionary will be written
to `./cndi/cluster_manifests/my-key.yaml`.

When ArgoCD is deployed in the cluster, it will apply all of the manifests in
the `./cndi/cluster_manifests/` directory.

There is one tranformation that happens to the manifest content, if and only if
it's `kind` is `Secret`. If `cndi ow` detects a `Secret` it will ensure the
`stringData` field contains only
`$cndi_on_ow.seal_secret_from_env_var(VAR_NAME)` calls. This will encrypt the
value from the environment for you, ensuring it is safe to store in your
repository.

Here is an example of the `cluster_manifests` section of the `cndi_config.yaml`

```yaml
infrastructure: { ... }
applications: { ... }
cluster_manifests:
  wp-ns: # typical resource, written to ./cndi/cluster_manifests/wp-ns.yaml
    apiVersion: v1
    kind: Namespace
    metadata:
      name: wordpress

  wordpress-secret: # secret resource, written to ./cndi/cluster_manifests/wordpress-secret.yaml as kind: SealedSecret
    apiVersion: v1
    kind: Secret
    metadata:
      name: wp-secret
      namespace: wordpress
    stringData:
      wordpress-password: $cndi_on_ow.seal_secret_from_env_var(WORDPRESS_PASSWORD)
```

All `Secret` resources provided will be converted to `SealedSecret` resources
using values from your environment. It is critical that they are declared with
the above `$cndi_on_ow.seal_secret_from_env_var(VAR_NAME)` syntax to ensure they
are encrypted properly.

Plaintext secrets in your repository are a security risk and will not be copied
to the cluster!
