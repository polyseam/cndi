# up and running with cndi

The best place to start for a new CNDI project is to populate your Template
prompts by following `cndi create -t <template>` and answering the questions.

If you have done this and are now hoping to learn how to interact with it,
you've come to the right place!

## ExternalDNS on `microk8s` Deployments

The best way to enable ExternalDNS on a `microk8s` deployment is to use the
`cndi show-outputs` command to get the `public_host` value:

```bash
cndi show-outputs
# example output:
get_kubeconfig_command = "aws eks update-kubeconfig --region us-east-1 --name my-cluster-project"
public_host = "ae79fd5d9e53e4e1f8efcf58c26c3a74-992606bf807ddf5f.elb.us-east-1.amazonaws.com"
resource_group_url = "https://us-east-1.console.aws.amazon.com/resource-groups/group/cndi-rg_mj-show-outputs"
```

Now we can use this `public_host` value to configure ExternalDNS to use the
correct host:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    external-dns.alpha.kubernetes.io/target: ae79fd5d9e53e4e1f8efcf58c26c3a74-992606bf807ddf5f.elb.us-east-1.amazonaws.com
spec: {...}
```

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

### Using non-microk8s distributions

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

### Using `microk8s` distribution

If you are using `microk8s` as your distribution, it is sometimes necessary to
debug the system by running commands directly on the cluster. This is not the
intended way to interact with your cluster. but sometimes bad things happen.

**ssh only**

If you do not require the ability to port-forward your cluster, but do need to
perform some task on the virtual machines or cluster, perform these steps:

1. After a successful deployment, run the following command to get the outputs
   from your cluster's latest deployment

```bash
cndi show-outputs
# example output:
get_kubeconfig_command = "ssh -i 'cndi_rsa' ubuntu@my-node.compute-1.amazonaws.com -t 'sudo microk8s config'"
#...
#...
```

2. Let's take just the first half of that command to SSH into the node:

```bash
ssh -i 'cndi_rsa' ubuntu@my-node.compute-1.amazonaws.com
```

From inside this ssh session you'll have access to `sudo microk8s kubectl ...`
commands for debugging.

**port-forwarding and kubeconfig**

However, if you do need to port-forward a service or require kubeconfig-based
access for some other reason, read on!

To be able to port-forward cluster services you'll need to open the port `16443`
to your system,

1. To open the port using cndi lets update our `cndi_config.yaml` file, lets add
   an entry to the `open_ports` list:

```yaml
cndi_version: v2
provider: aws
distribution: microk8s
infrastructure:
  cndi:
    open_ports: # new!
      - name: kubeapi # arbitrary name
        number: 16443
```

2. Lets call `cndi ow` to prepare the opening of this port, then push the
   changes to Git, CNDI will open the port on your nodes for you.

3. Next, we want to get the unique command required to pull down our
   `kubeconfig` file, run the following command:

```bash
cndi show-outputs
# example output:
get_kubeconfig_command = "ssh -i 'cndi_rsa' ubuntu@my-node.compute-1.amazonaws.com -t 'sudo microk8s config'"
public_host = "tf-lb-myloadbalancer.elb.us-east-1.amazonaws.com"
resource_group_url = "https://us-east-1.console.aws.amazon.com/resource-groups/group/cndi-rg_my-project"
# ...
```

4. The `get_kubeconfig_command` output shows a command that you can run to get a
   block of 'kubeconfig' that looks like this:

```yaml
# KUBECONFIG before
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ...
    server: https://10.0.1.158:16443 # this ip address must be updated to a public address to connect remotely
  name: microk8s-cluster
contexts: ...
users: ...
- name: admin
  user: ...
```

However that `kubeconfig` data needs to be updated in a couple places before it
can be useful:

1. we want to update the `server` field to the host we connected to by SSH in
   our `get_kubeconfig_command` output
2. we want to add a `insecure-skip-tls-verify: true` field to the cluster block

```yaml
# after
apiVersion: v1
clusters:
- cluster:
    insecure-skip-tls-verify: true # updated!
    server: https://my-node.compute-1.amazonaws.com:16443 # updated!
    certificate-authority-data: ...
  name: microk8s-cluster
contexts: ...
users: ...
- name: admin
  user: ...
```

Once those lines have been update you can use them with `kubectl` by placing
them in you `~/.kube/config` file.

To use portforwarding to access the cluster after this configuration is set, run
the following command:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:80
```
