# up and running with cndi

The best place to start for a new CNDI project is to populate your Template
prompts by following `cndi create -t <template>` and answering the prompts.

If you have done this and are now hoping to learn how to interact with it,
you've come to the right place!

## Accessing your cluster

**wait why??**

CNDI deploys your cluster and you manage it from Git. Modifying your cluster
should be done by changing your `cndi_config.yaml`, calling `cndi overwrite` and
pushing your changes to Git.

But sometimes you'd like to be able to access your cluster nodes directly, or to
interact with `kubectl` in a readonly way. This guides aims to grant you access.
With great power comes great responsibility!

**so who is this guide for?**

This section may be for you if:

- You want access to `kubectl` and are confident that GitOps is not the best way
  forward for this issue
- You didn't configure ArgoCD to be accessible from the internet
- You tried to configure ArgoCD to be accessible from the internet but it didn't
  work

If you are in one of these categories, read on!

If you are using a distribution that isn't based on Microk8s
(`eks`,`aks`,`gke`), you should be able to get access to your cluster locally
with 2 simple steps:

1. After a successful deployment, run the following command to get the outputs
   from your cluster's latest deployment

```bash
cndi show-outputs
```

2. Copy the `get_kubeconfig_command` command and run it in your terminal

```bash
# example:
get_kubeconfig_command = "aws eks update-kubeconfig --region us-east-1 --name my-cluster-project"
public_host = "ae79fd5d9e53e4e1f8efcf58c26c3a74-992606bf807ddf5f.elb.us-east-1.amazonaws.com"
resource_group_url = "https://us-east-1.console.aws.amazon.com/resource-groups/group/cndi-rg_mj-show-outputs"
```

3. You should now have access to your cluster with `kubectl`!
