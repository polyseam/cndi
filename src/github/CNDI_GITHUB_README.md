# CNDI GitHub Workflows

We have created this file and a file called `.github/workflows/cndi-run.yaml`

The workflow file is responsible for provisioning the nodes you have defined in
`cndi/nodes.json`.

Effectively this means that the `cndi-run.yaml` workflow is only responsible for
executing the command `cndi run`.

All other cluster tasks will be handled by argocd, by reading the manifests in
`cndi/cluster` and the folders within that.
