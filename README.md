# cndi-next

This is the next version of CNDI. It deploys an entire data stack in minutes.

It's perfect for deploying Data Products consistently that are reliable,
discoverable, maintainable, and interoperable, all while remaining flexible to
the needs of each Data Product.

## getting started

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi-next/main/install.sh | sh
```

## configuration

There are 2 options for configuring your next data stack. The first is to use
our online configurator tool, it will be live at
[configurator.cndi.run](https://configurator.cndi.run) and is probably the most
fun. But the config is just a file, so you can also write it by hand if you
want.

Let's run through the 4 parts of a `cndi-config.json` file.

### nodes

We specify an object called `nodes` with some default configuration and an array
of node `entries`. Each `node entry` represents a virtual machine we will create
on your behalf.

These nodes will become nodes in your Kubernetes cluster, but you don't need to
worry about that. You specify how many virtual machines to create in order to
run your new data stack, and you specify where they will be deployed, and how
powerful they are.

These nodes must each be one of the following `kinds`:

- [x] aws
- [ ] azure
- [ ] gcp
- [ ] local
- [ ] remote
- [ ] vmware

We also specify the node `role`, this is either `"controller"` or `"worker"`.

Here is an example `cndi-config.json` object that contains a set of node entries
to deploy:

```jsonc
{
  "nodes": {
    "entries": [
      {
        "kind": "gcp",
        "role": "controller",
        "name": "gcp-controller",
        "InstanceType": "t2.large"
      },
      {
        "kind": "gcp",
        "role": "worker",
        "name": "gcp-worker"
      },
      {
        "kind": "aws", // whoa, multicloud!
        "role": "worker",
        "name": "aws-worker"
      }
    ],
    "deploymentTargetConfiguration": {
      "aws": {
        "InstanceType": "t2.medium"
      }
    }
  }
  // tip: we parse this file as JSONC so you can add comments!
}
```

With `nodes` you specify your infrastructure and there will be many more options
to choose from soon!

### applications

The next thing we need to configure is the applications that will actually run
on the cluster. With CNDIv1 we focused on making it a breeze to deploy
[Apache Airflow](https://github.com/apache/airflow) in Kubernetes.

Lets see what that might look like:

```jsonc
{
  "nodes": {...},
  "applications": {
    "airflow": {
      "targetRevision": "1.6.0", // version of Helm chart to use
      "destinationNamespace": "airflow", // kubernetes namespace in which to install application
      "repoURL": "https://airflow.apache.org",
      "chart": "airflow",
      "values": {
        "dags": {
          "gitSync": {
            "enabled": true,
            "repo": "https://github.com/polyseam/demo-dag-bag",
            "branch": "main",
            "wait": 70,
            "subPath": "/dags"
          }
        },
        // These options are required by Airflow in this context
        "createUserJob":{
          "useHelmHooks": false
        },
        "migrateDatabaseJob":{
          "useHelmHooks": false
        }
      }
    }
  }
}
```

### cluster

The next aspect of configuration is related to the Kubernetes cluster we are
going to be deploying, but don't worry, we'll make it easy!

```jsonc
{
  "nodes": {...},
  "applications": {...},
  "cluster": {// inside the "cluster" object you can put all of your custom Kubernetes manifests
    "ingress": {
      "apiVersion": "networking.k8s.io/v1",
      "kind": "Ingress",
      "metadata": {
        "name": "minimal-ingress",
        "annotations": {
          "nginx.ingress.kubernetes.io/rewrite-target": "/"
        }
      },
      "spec": {...}
    }
  }
}
```

### dpr

If you are using CNDI to deploy a Data Product, and want to persist information
about your Data Product to the
[Polyseam Data Product Registry](https://polyseam.io/registry), just add one
more block to the config:

```jsonc
{
    "nodes": {...},
    "applications": {...},
    "cluster": {...},
    // TODO: we don't actually commit DP metadata to DPR yet
    "dpr": {
        "organization": "daff",
        "domain": "playlists",
        "data-product": "top-running-songs"
    }
}
```

There, we have a complete `my-cndi-config.json` file. Let's see what happens
when we run:

## cndi init

```bash
cndi init -f ./my-cndi-config.json .
```

Wow!

In the current directory we've created a few files and folders. Let's go through
what `cndi init` produced for us:

1. a `.github` folder, with some GitHub Actions inside. These GitHub Action
   scripts are actually mostly just wrapping the `cndi run` command in the CNDI
   binary executable. As such, if you have a different CI system, you can
   execute the `cndi run` command on the binary there instead.

2. a `cndi/nodes.json` file, this is essentially the `nodes` object you passed
   into `cndi init`, if there are any sensitive fields here, they will be
   stripped out, and will need to be passed in as secret environment variables
   to `cndi run`.

3. a `cndi/cluster` folder, containing Kubernetes manifests that will be
   installed on your new cluster when it is up and running. This includes things
   like `ingress`, and the configuration of `ArgoCD`.

4. a `cndi/cluster/applications` folder, which contains a folder for each
   application defined in the `"applications"` section of your
   `cndi-config.json`, and a generated Helm Chart inside that contains our
   expertly chosen defaults, and the spefic parameters you've specified yourself
   in the `"applications"` section of your `cndi-config.json`.

5. a `./README.md` file that explains how you can use and modify these files
   yourself for the lifetime of the cluster

## first time setup

Our next task is to bring this cluster to life. The first step is to push all of
the files `cndi` created for us up to GitHub.

Once we've done this, the GitHub Actions contained in the repo will begin
execution, because they are triggered by changes being pushed to the `main`
branch.

Our first push will begin to create nodes, and it's important to remember that
before these nodes are Kubernetes nodes, they must first be created as virtual
machines. Every platform handles their compute engine a little bit differently
in terms of inputs and APIs, but CNDI is going to abstract all of that away from
you.

## cndi run

When changes are made to the `main` branch of our repo `cndi run` will check if
there have been any changes to our `cndi/nodes.json` file and if so it will
kickoff async Promises for the creation of each virtual machine that does not
yet exist, and changes to those that do.

When a virtual machine is live, cndi will install `microk8s` on each machine.
When microk8s is installed on the machines, we will use it to join all the
machines together as nodes in a Kubernetes cluster. When a node joins the
cluster, it becomes controlled by the Kubernetes control plane, which is running
on the node(s) with the `role` "controller".

Because `argocd` has been configured to watch the `cndi/cluster` folder, changes
to the manifests in that folder will automatically be applied with eventual
consistency, including the first commit.

## making changes to your cluster

When you want to further update your cluster, the process is simple. You make a
change to your `cndi-config.json` file and run
`cndi overwrite-with -f my-new-config.json`. CNDI will delete the contents of
`cndi/` and it will build up that directory from scratch based on your
`my-new-config.json`.

CNDI does this instead of patching the files because it may be the case that
your changes to `my-new-config.json` are incompatible with the state of the
directory if files in there were modified by hand. Of course when you make a new
pull request though, you will be making a PR with the diff between the new state
of `cndi/` and the old.

You are also able to modify the manifests in `cndi/cluster` and make changes to
`cndi/nodes.json` yourself, but be careful: if you then run
`cndi overwrite-with -f my-new-config.json` after manual changes, you will blast
those changes away unless they are also present in `my-new-config.json` .

## updating data product registry

If you want to opt-in to having the polyseam data product registry track this
repo as a data product, CNDI can handle this for you too! Whenever you make
changes to your `main` branch CNDI will persist information about your data
product to the registry including releases, documentation, infrastructure,
source code, output ports and more!

## building cndi-next (Contributor Guide)

If you are hoping to contribute to this project and want to learn the ropes, you
are in the right place. Let's start with setting up your environment:

### setup

The first step as you might expect is to clone the repo. Take note of where you
clone to, it will matter later when we setup some convenience aliases.

**1. Clone Repo:**

```bash
git clone https://github.com/polyseam/cndi-next
```

**2. Install Deno:**

Next let's [install deno](https://deno.land/#installation), though it can be
installed with a package manager, I would recommend that you install it without
one. Once deno is installed, make sure you add it to your PATH.

**3. Setup cndi Alias:** Let's setup an alias to make our experience just like
it will be for the end user when we launch.

```bash
# make sure the path below is correct, pointing to the main.ts file in the repo
alias cndi="deno run -A --unstable ~/dev/polyseam/cndi-next/main.ts"
```

### your first cluster

You can now setup a new directory for the cluster you intend to create. Start
with an empty folder and create a `my-cndi-config.jsonc` file. This will specify
what you want in your cluster for applications, manifests, and nodes. To see an
example checkout the file `cndi-config.jsonc` inside the `cndi-next` repo.

```bash
cndi init -f my-cndi-config.jsonc
```

This will scaffold out your project and you are almost ready to deploy.

Let's make sure we have some environment variables set so that CNDI can
provision your cluster using your cloud credentials, and setup argo to watch the
cluster repo we will setup next. Create a file in the directory where you just
saved `my-cndi-config.jsonc` called `.env`. Environment variables here will be
read by `cndi run`.

```bash
# .env

# AWS Credentials
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION=us-east-1

# Git Credentials
GIT_USERNAME="your-username"
GIT_PASSWORD="your-personal-access-token"
GIT_REPO="https://github.com/example-org/example-repo"
```

Also, don't forget to create a `.gitignore` file there too so we can make sure
the credentials we will save don't get uploaded to git.

```bash
echo ".env" >> .gitignore
```

You're all set to push this code up to GitHub, just create a repo and push up
the contents of the folder.

```bash
git add .
git commit -m 'first commit'
git push
```

Now we just need to deploy the cluster:

```
cndi run
```

Your cluster will take a few minutes to deploy, in the meantime make sure you
have `kubectl` installed, we will need that to connect to our node securely
until we open it up using an `Ingress` declaration.

### port-forward application

When working with Kubernetes it is often required to connect to services running
on your nodes without exposing those services to the internet. We accomplish
this using Kubernetes Config files, and the `kubectl port-forward` command.

Let's give that a try!

**1. Login to node using cloud console:**

Open the cloud console and visit the page that lists your running virtual
machines, in AWS this is the
[EC2 Instances page](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:v=3)
(the region parameter of this url must be updated if your instances are not in
`us-east-1`).

Click on the node id link in the UI for your controller, then click `Connect` in
the top right. Copy the `"Public IP address"` value and paste it in a note for
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
    server: https://172.31.90.189:16443 # the IP address provided here is typically the private IP of the Kubernetes controller. We need to update this to the public IP of the controller so we can access it from outside of the node's network. The port should stay as "16443" and the scheme as "https://".
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
listed and replace it with the _public_ IP address of your controller node that
you copied just before connecting. If you don't change the IP address it will be
set to the Private IP of the node, and we can't connect to the private IP from
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
password. We know the username but not yet the password.

**6. Logging into Argo:**

Let's leave the service running and get the `password` from the cluster now in a
separate shell:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" --insecure-skip-tls-verify| base64 -d; echo
```

You should now see a password displayed that looks something like:

```
wLLoUS3493WlHKpc
```

Let's once again go to the the argo web UI, and enter the credentials including
the password you just got:

Username: `admin`

Password: `wLLoUS3493WlHKpc`

That concludes the section on setting up CNDI for development, you should now
have an operational CNDI Cluster! 🎉

If you have any issues please message [Matt](https://github.com/johnstonmatt) or
[Tamika](https://github.com/IamTamika) in the Polyseam Chat.
