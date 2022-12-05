<div align="center">
  <br>
  <img alt="CNDI" src="docs/img/cndi-logo.png" width="300px">
  <h1>cndi</h1>
  <div>Deploy <strong>Cloud-Native Data Infratructure</strong> in Minutes</div>
</div>
<br>
<p align="center">
  <a href="https://github.com/polyseam/cndi/actions/workflows/main-latest.yaml">
    <img src="https://github.com/polyseam/cndi/actions/workflows/main-latest.yaml/badge.svg" alt="main release" style="max-width: 100%;">
  </a>
  <img src="https://img.shields.io/badge/Dependabot-active-brightgreen.svg" alt="Dependabot Badge">
  <img src="https://img.shields.io/github/languages/code-size/polyseam/cndi" alt="GitHub code size in bytes">
  <img src="https://img.shields.io/github/commit-activity/w/polyseam/cndi" alt="GitHub commit activity">
  <a href="https://github.com/polyseam/cndi/issues">
    <img src="https://img.shields.io/github/issues/polyseam/cndi" alt="GitHub issues">
  </a>
  <!-- TODO: add when there are releases-->
  <!-- <a href="https://github.com/polyseam/cndi/releases">
    <img src="https://img.shields.io/github/v/release/polyseam/cndi.svg?style=flat" alt="GitHub Release">
  </a> -->
  <a href="https://discord.gg/ygt2rpegJ5">
    <img src="https://img.shields.io/discord/956275914596040754.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="Discord">
  </a>
  <a href="https://twitter.com/Polyseam">
    <img src="https://img.shields.io/twitter/follow/Polyseam?label=Follow&style=social" alt="Twitter">
  </a>
</p>

Welcome to CNDI, it deploys an entire data stack in minutes!

It's perfect for deploying Data Products consistently that are reliable,
discoverable, maintainable, and interoperable, all while remaining flexible to
the needs of each stack.

## getting started

### installation

```bash
# if you are on windows you should run this in 'git bash'
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
# when cndi is successfully added to your PATH and executable, run:
cndi install
```

### usage

CNDI is always ran inside of a git repository, for the sake of this example we
are using GitHub. The first step is to create a new repository, and then clone
it locally. This is made easy by using the [gh cli](https://github.com/cli/cli).

```bash
# create a repo and clone it locally
gh repo create cndi-example --private --clone && cd cndi-example
# initialize a new cndi project using CNDI's interactive mode
cndi init -i
# select a template, and fill out the interactive prompts
```

After you've answered the prompts, you will have a new `cndi-config.jsonc` file
and all other files described in the [cndi init](#cndi-init) section of this
README.

## configuration

Let's run through the 3 parts of a `cndi-config.json` file.

### nodes

We specify an object called `nodes` with an array of node `entries`. Each
`NodeEntry` represents a virtual machine we will create on your behalf.

These nodes will become nodes in your Kubernetes cluster, but you don't need to
worry about that. You specify how many virtual machines to create in order to
run your new data stack, and you specify where they will be deployed, and how
powerful they are.

Don't worry too much about getting the number of nodes or their size right the
first time, you can adjust them later on the fly!

These nodes must each be one of the following `kinds`:

- [x] aws
- [x] gcp
- [ ] azure
- [ ] local
- [ ] remote
- [ ] vmware

We also specify the node `role`, this is `"controller"` by default, and exactly
one node must be a `"leader"`.

Here is an example `cndi-config.jsonc` object that contains a set of node
entries to deploy:

```jsonc
{
  "nodes": {
    "entries": [
      {
        "name": "gcp-alpha",
        "kind": "gcp",
        "role": "leader",
        "machine_type": "n2-standard-16"
      },
      {
        "name": "gcp-beta",
        "kind": "gcp"
      },
      {
        "name": "gcp-charlie",
        "kind": "gcp"
      }
    ],
    "deploymentTargetConfiguration": {
      "gcp": {
        "machine_type": "n2-standard-8" // this overrides the default machine_type
      }
    }
  }
  // tip: we parse this file as JSONC so you can add comments!
}
```

With `nodes` you specify your infrastructure, and we handle tying all your nodes
together as a unified cluster.

### applications

The next thing we need to configure is the applications that will actually run
on the cluster. With CNDIv1 we focused on making it a breeze to deploy
[Apache Airflow](https://github.com/apache/airflow) in Kubernetes.

Lets see how we accomplish this here in this new and improved CNDI:

```jsonc
{
  "nodes": {...},
  "applications": {
    "airflow": {
      "targetRevision": "1.7.0", // version of Helm chart to use
      "destinationNamespace": "airflow", // kubernetes namespace in which to install application
      "repoURL": "https://airflow.apache.org",
      "chart": "airflow",
      "values": {
        // where you configure your Helm chart values.yaml
        "dags": {
          "gitSync": {
            "enabled": true,
            "repo": "https://github.com/polyseam/demo-dag-bag",
            "branch": "main",
            "wait": 70,
            "subPath": "dags"
          }
        },
        // These options are required by Airflow in this context
        "createUserJob": {
          "useHelmHooks": false
        },
        "migrateDatabaseJob": {
          "useHelmHooks": false
        }
      }
    }
  }
}
```

### cluster

The third aspect of a `cndi-config` file is the `"cluster"` object. Any objects
here will be used as Kubernetes Manifests and they'll be applied to your cluster
through ArgoCD. This gives CNDI infinite flexibility, so you can deploy any
Kubernetes resource you want. You only need to modify this object if you want to
go beyond one of the templates we provide, otherwise you can ignore it!

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

Pro tip!

If you want to add a new secret to use inside of your Kubernetes cluster, we
make this possible by encrypting your secrets with
[sealed-secrets](https://github.com/bitnami-labs/sealed-secrets) so they can
live in your repo securely and be picked up by ArgoCD automatically. To add a
secret to your cluster add the value to your `.env` file, and CNDI will seal it.
The example below results in sealing the environment variables `"GIT_USERNAME"`
and `"GIT_PASSWORD"`, into the destination secret key names
`"GIT_SYNC_USERNAME"` and `"GIT_SYNC_PASSWORD"` respectively.

```jsonc
{
  "nodes": {...},
  "applications": {...},
  "cluster": {
    "airflow-git-credentials-secret": {
      "apiVersion": "v1",
      "kind": "Secret",
      "metadata": {
        "name": "airflow-git-credentials",
        "namespace": "airflow"
      },
      "stringData": {
        "GIT_SYNC_USERNAME": "$.cndi.secrets.GIT_USERNAME",
        "GIT_SYNC_PASSWORD": "$.cndi.secrets.GIT_PASSWORD"
      }
    }
  }
}
```

There, we have a complete `my-cndi-config.jsonc` file. Let's see what happens
when we run:

## cndi init

```bash
cndi init -f ./my-cndi-config.jsonc
```

Wow!

In the current directory we've created a few files and folders. Let's go through
what `cndi init` produced for us:

1. a `.github` folder, with a GitHub Action inside. The workflow is mostly just
   wrapping the `cndi run` command in the CNDI binary executable. As such, if
   you have a different CI system, you can execute the `cndi run` command on the
   binary there instead.

2. a `cndi/terraform` folder, containing the infrastructure resources cndi has
   generated for terraform, which cndi will apply automatically every time
   `cndi run` is executed.

3. a `cndi/cluster` folder, containing Kubernetes manifests that will be
   installed on your new cluster when it is up and running. This includes
   manifests like `Ingress` from the `"cluster"` section of your
   `cndi-config.jsonc`.

4. a `cndi/cluster/applications` folder, which contains a folder for each
   application defined in the `"applications"` section of your
   `cndi-config.jsonc`, and a generated Helm Chart inside that contains our
   expertly chosen defaults, and the spefic parameters you've specified yourself
   in the `"applications"` section of your `cndi-config.jsonc`.

5. a `.env` file which contains all of your environment variables that CNDI
   relies on, these values must be environment variables that are defined and
   valid when `cndi run` is executed.

6. a `.gitginore` file to ensure secret values never get published as source
   files to your repo

7. a `./README.md` file that explains how you can use and modify these files
   yourself for the lifetime of the cluster

## first time setup

Our next task is to bring this cluster to life. The first step is to set the
environment variables from your `.env` file as GitHub Actions Secrets. This is
made very easy with the [GitHub CLI](https://github.com/cli/cli).

```bash
gh secret set -f .env
```

Now all we need to do is push up all of our source files that CNDI generated to
GitHub.

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
there have been any changes to our `cndi/terraform`, and if the state of the
desired cluster in these files is different than the actual cluster in the
cloud, terraform will apply the necessary changes to the infrastructure to make
the real-world state match the desired state in the repo.

When a virtual machine is live, cndi will install `microk8s` on each machine.
When microk8s is installed on the machines, we will use it to join all the
machines together as nodes in a Kubernetes cluster. When a node joins the
cluster, it becomes controlled by the Kubernetes control plane, which is running
on the node(s) with the `role` `"controller"` or `"leader"`.

Because `ArgoCD` has been configured to watch the `cndi/cluster` folder, changes
to the manifests in that folder will automatically be applied with eventual
consistency, including the first commit.

## making changes to your cluster

When you want to further update your cluster, the process is simple. You make a
change to your `cndi-config.jsonc` file and run
`cndi overwrite-with -f my-new-config.jsonc`. CNDI will delete the contents of
`cndi/` and it will build up that directory from scratch based on your
`my-new-config.jsonc`.

CNDI does this instead of patching the files because it may be the case that
your changes to `my-new-config.jsonc` are incompatible with the state of the
directory if files in there were modified by hand. Of course when you make a new
pull request though, you will be making a PR with the diff between the new state
of `cndi/` and the old.

Note: Your SealedSecret manifests will be updated any time `cndi overwrite-with`
is called, but the underlying secrets themselves are not changing. This causes a
git diff, but there is no material impact to the cluster.

Alternatively to running `cndi ow` (`cndi overwrite-with`), you are also able to
modify the manifests in `cndi/cluster` and make changes to `cndi/terraform`
resources yourself, but be careful: if you then run
`cndi ow -f my-new-config.jsonc` after manual changes, you will blast those
changes away unless they are also present in `my-new-config.jsonc` .

## building cndi (Contributor Guide)

If you are hoping to contribute to this project and want to learn the ropes, you
are in the right place. Let's start with setting up your environment:

### setup

The first step as you might expect is to clone the repo. Take note of where you
clone to, it will matter later when we setup some convenience aliases.

**1. Clone Repo:**

```bash
git clone https://github.com/polyseam/cndi
```

**2. Install Deno:**

Next let's [install deno](https://deno.land/#installation), though it can be
installed with a package manager, I would recommend that you install it without
one. Once deno is installed, make sure you add it to your PATH.

**3. Setup cndi Alias:** Let's setup an alias that allows us to use the deno
source code as if it were the regular CLI, without colliding with the released
`cndi` binary

```bash
# make sure the path below is correct, pointing to the main.ts file in the repo
alias cndi="deno run -A --unstable ~/dev/polyseam/cndi/main.ts"
```

### your first cluster

You can now setup a new directory for the cluster you intend to create. Start
with an empty folder and create a `my-cndi-config.jsonc` file. This will specify
what you want in your cluster for applications, manifests, and nodes. To see an
example checkout the file `cndi-config.jsonc` inside the `cndi` repo.

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
[Tamika](https://github.com/IamTamika) in the
[Polyseam Discord Chat](https://discord.gg/ygt2rpegJ5).

<!-- DMINR -->
