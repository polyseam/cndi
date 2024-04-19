# up and running with cndi

The best place to start for a new CNDI project is to populate your Template
prompts by following `cndi create -t <template>` and answering the questions.

If you have done this and are now hoping to learn how to interact with it,
you've come to the right place!

This guide will provide different information based on your `provider` and
`distribution`, and in the best case you won't need this guide at all!

**wait why??**

CNDI deploys your cluster and you manage it from Git. Modifying your cluster
should be done by changing your `cndi_config.yaml`, calling `cndi overwrite` and
pushing your changes to Git.

You may at times want to peek under-the-hood and look at ArgoCD, but in the
happy case, you should just be able to visit it by going to the domain name you
chose to deploy it to.

**so who is this guide for?**

This guide may be for you if:

- You want access to `kubectl` and are confident that GitOps is not the best way
  forward
- You didn't configure ArgoCD to be accessible from the internet
- You tried to configure ArgoCD to be accessible from the internet but it didn't
  work

If you are in one of these categories, read on!

## Accessing your cluster

### Using `microk8s` distribution

If you are using `microk8s` as your distribution, it is sometimes necessary to
debug the system by running commands directly on the cluster. This is not the
intended way to interact with your cluster. but sometimes bad things happen.

To access your cluster, find the command which is shown at the end of the
successeful `cndi run` job in GitHub Actions.
