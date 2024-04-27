# connecting to your cndi cluster

Connecting to Kubernetes clusters is generally done using the `kubectl` CLI (we
pronounce it "kube-cuddle" because it's cute).

We like to avoid using `kubectl` directly because CNDI enables a GitOps workflow
where all cluster changes are made in the `cndi_config.yaml` file, transformed
using `cndi ow` and applied by ArgoCD when pushed to git. Sometimes it's
required though, and this guide will show you how to do it.

If you need to:

- port-forward a service to your local machine
- debug a pod by exec'ing into it
- run arbitrary "read-only" `kubectl` commands

You could have a valid reason to use `kubectl`, so let's configure it for use.

## kubeconfig

By default `kubectl` uses a YAML-based configuration file located at
`~/.kube/config` to configure credentials and endpoints for each cluster's
[Kubernetes API](https://kubernetes.io/docs/concepts/overview/kubernetes-api/),
as well as a context field to define which cluster is currently being interacted
with.

When you run `cndi show-outputs` you will see a `get_kubeconfig_command` which
you can run to configure `kubectl` to interact with your cluster. Note, you will
need to have the apropriate cloud CLI installed and configured to use the same
profile.

### AWS EKS

Command:

```shell
cndi show-outputs
```

Output:

```
get_kubeconfig_command = "aws eks update-kubeconfig --region us-east-1 --name eks-readme"
public_host = "a3541faf0d7a0406d99a38c2e21a8376-6763fdd7f6b6e343.elb.us-east-1.amazonaws.com"
resource_group_url = "https://us-east-1.console.aws.amazon.com/resource-groups/group/cndi-rg_eks-readme"
```

Command:

```shell
aws eks update-kubeconfig --region us-east-1 --name eks-rdme
```

Output:

```
Added new context arn:aws:eks:us-east-1:123456789012:cluster/eks-readme to /Users/mj/.kube/config
```

### Azure AKS

Command:

```shell
cndi show-outputs
```

Output:

```
get_kubeconfig_command = "az aks get-credentials --resource-group rg-aks-readme --name cndi-aks-cluster-aks-readme --overwrite-existing"
public_host = "4.236.186.78"
resource_group_url = "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/aks-readme"
```

Command:

```shell
az aks get-credentials --resource-group rg-aks-readme --name cndi-aks-cluster-aks-readme --overwrite-existing
```

Output

```
Merged "cndi-aks-cluster-aks-readme" as current context in /Users/m/.kube/config
```

### GCP GKE

Command:

```shell
cndi show-outputs
```

Output:

```
get_kubeconfig_command = "gcloud container clusters get-credentials gke-readme --region us-central1 --project gke-readme"
public_host = "34.72.155.129"
resource_group_url = "https://console.cloud.google.com/welcome?project=gke-readme"
```

Command:

```shell
gcloud container clusters get-credentials gke-readme --region us-central1 --project gke-readme
```

Output:

```
Fetching cluster endpoint and auth data.
kubeconfig entry generated for gke-readme.
```

## testing the connection

The best way to check your kubernetes cluster connection is to hit the
Kubernetes API server and ask it to list the nodes in the cluster:

```shell
kubectl get nodes
```

## port-forwarding

Port-forwarding is a way to expose a service running in a Kubernetes cluster to
your local machine. This is useful for debugging services that are not publicly
accessible, or for running a service locally that is normally only available in
the cluster.

Here's a command for port-forwarding ArgoCD which can be especially useful for
debugging:

```shell
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
