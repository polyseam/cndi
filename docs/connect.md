# connecting to your cndi cluster

Connecting to Kubernetes clusters is generally done using the `kubectl` CLI (we
pronounce it "kube-cuddle" because it's cute). 

We like to avoid using `kubectl` directly because CNDI enables a GitOps workflow where all cluster changes are made in the `cndi_config.yaml` file, transformed using `cndi ow` and applied by ArgoCD when pushed to git. Sometimes it's required though, and this guide will show you how to do it.

If you need to:

- port-forward a service to your local machine
- debug a pod by exec'ing into it
- run arbitrary "read-only" `kubectl` commands

You could have a valid reason to use `kubectl`, so let's configure it for use.

## kubeconfig

By default `kubectl` uses a YAML-based configuration file located at `~/.kube/config` to configure credentials and endpoints for each cluster's [Kubernetes API](https://kubernetes.io/docs/concepts/overview/kubernetes-api/), as well as a context field to define which cluster is currently being interacted with.

When you run `cndi show-outputs` you will see a `get_kubeconfig_command` which you can run to configure `kubectl` to interact with your cluster. Note, you will need to have the apropriate cloud CLI installed and configured to use the same profile

```bash
# example:
get_kubeconfig_command = "aws eks update-kubeconfig --region us-east-1 --name mj-eks-rdme"
public_host = "a3541faf0d7a0406d99a38c2e21a8376-6763fdd7f6b6e343.elb.us-east-1.amazonaws.com"
resource_group_url = "https://us-east-1.console.aws.amazon.com/resource-groups/group/cndi-rg_mj-eks-rdme"
```

