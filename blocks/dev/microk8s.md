## microk8s

Your `dev` cluster will be deployed locally using
[multipass](https://multipass.run/) for virtualization, so you will need to
install that first. For more information on how to install multipass, see the
[multipass documentation](https://multipass.run/docs/tutorial#install-multipass)
for your OS.

Once [multipass](https://multipass.run) is installed and you've pushed this
repository to git, you can spin up your cluster by running:

```bash
cndi run
```

This will create a new virtual machine with microk8s installed, and deploy your
workload to it. This approach is powered by the `--cloud-init` option in
[multipass](https://multipass.run/docs/launch-command), which enables running
some setup configuration and scripts on the VM at launch time.

### up and running

Now that the node has been created and your workload has begun to deploy you can
start to interact with your cluster.

### Accessing the ArgoCD UI

To get the IP address of the node you can call `multipass list` and copy the IP
address of the node.

```bash
# replace `my-project-node` with the name of your node in cndi_config.yaml
export NODE_IP=$(multipass exec my-project-node -- ip route get 1.2.3.4 | awk '{print $7}')
```

Now that you have an IP for the node you can port forward the ArgoCD server
service to your local machine by substituting the IP address of the node into
the following command:

```bash
multipass exec my-project-node -- sudo microk8s kubectl port-forward svc/argocd-server -n argocd 8080:443 --address $NODE_IP
```

You can now access the ArgoCD UI by navigating to `https://$NODE_IP:8080` in
your browser and logging in with the default username `admin` and the
`ARGOCD_ADMIN_PASSWORD` from your [./env](./env) file.

### Accessing other Services

To access other services running in your cluster you can use the same approach,
but substitute the service name and namespace into the `port-forward` command.

```bash
multipass exec my-project-node -- sudo microk8s kubectl port-forward svc/my-service -n my-namespace 8080:80 --address $NODE_IP
```
