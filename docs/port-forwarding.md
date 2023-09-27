# port-forwarding

When working with Kubernetes it is often required to connect to services running
on your nodes without exposing those services to the internet. We accomplish
this using Kubernetes Config files, and the `kubectl port-forward` command.

Let's give that a try!

[Here's a guide of how to connect to your Azure Kubernetes Cluster(AKS) once its deployed and Port Forward](docs/walkthroughs/aks/port-forwarding.md)

[Here's a guide of how to connect to your Google Kubernetes Cluster(GKE) once its deployed and Port Forward](docs/walkthroughs/gke/port-forwarding.md)

[Here's a guide of how to connect to your Amazon Kubernetes Cluster(EKS) once its deployed and Port Forward](docs/walkthroughs/eks/port-forwarding.md)

Below is a guide of how to connect to your unmanaged Amazon Kubernetes
Cluster(aws)

**1. Login to node using cloud console:**

Open the cloud console and visit the page that lists your running virtual
machines, in AWS this is the
[EC2 Instances page](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:v=3)
(the region parameter of this url must be updated if your instances are not in
`us-east-1`).

Click on the node id link in the UI for your leader, then click `Connect` in the
top right. Copy the `"Public IP address"` value and paste it in a note for
yourself. We will need it later to connect to our node remotely. Type `"ubuntu"`
into the `User name` field, and click `Connect`.

**2. Retrieve Kubernetes config:**

When you have a prompt available to you, enter the following command to retrieve
the Kubernetes config for your microk8s cluster:

```bash
microk8s config
```

This will give you a great big blob of yaml. Consider this your key to access
the cluster from the outside of the cloud. With it on your machine you will be
able to talk to the Kubernetes control plane.

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data:
    dNPUHFObk9utNxN5cNI3T2bWF...PQotLS0tLLUVORCtLS0tCgBDRVJUSUZJQ0FURS0==
    server: https://173.31.90.189:16443 # the IP address provided here is typically the private IP of the Kubernetes controller. We need to update this to the public IP of the controller so we can access it from outside of the node's network. The port should stay as "16443" and the scheme as "https://".
  name: microk8s-cluster
contexts:
- context:
    cluster: microk8s-cluster
    user: admin
  name: microk8s
current-context: microk8s
kind: Config
preferences: {}
users:
- name: admin
  user:
    token: dnQmY3lJz...3Y4ODo3c2MwN0ltT1R
```

**3. Update IP Address in Kubernetes Config:**

You want to take this yaml blob to a text editor and replace the IP address
listed and replace it with the _public_ IP address of your leader node that you
copied just before connecting. If you don't change the IP address it will be set
to the Private IP of the node, and we can't connect to the private IP from
outside of the cloud.

**4. Add Kubernetes config to your work station:**

Next you want to take that text with the newly set Public IP, and put it in your
kubernetes config file, which is probably located at `~/.kube/config`. You can
[merge](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#merging-kubeconfig-files)
your configs, but if you are new to this you can just delete the contents of
that default config file file and replace them with our yaml.

**5. Port Forwarding a Service:**

Port forwarding a service is the same process no matter which service you are
forwarding, there are just a couple variables. Let's examine this process for
ArgoCD, because it will be running on every CNDI cluster, but this applies
equally to any other service.

We need to know the `namespace` of the service, the `service name`, the
`exposed port` and the `desired port`. Let's see what we can find out about the
services argo is running now that we have setup control plane access in the last
step.

```bash
# TODO: find a way to avoid this flag if possible without a custom domain name
kubectl get svc --namespace argocd --insecure-skip-tls-verify
```

We can now see that in our Kubernetes cluster we have a number of Argo services
running in the `argocd` namespace. The one we want is `argocd-server` running on
ports `80` and `443`.

Let's forward the application running on port `80` to our local machine.

```bash
kubectl port-forward svc/argocd-server --namespace argocd :80
```

You will see a message similar to:

```
Forwarding from 127.0.0.1:50445 -> 8080
```

Let's open the port displayed in the browser:

eg: `http://127.0.0.1:50445`

You should now see a login page for argo, and a place to enter a username and
password. The username is `admin` and the password is available in the `.env`
file we created for you under the key `ARGOCD_ADMIN_PASSWORD`.
