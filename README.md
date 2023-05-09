<div align="center">
  <br>
  <img alt="CNDI" src="docs/img/cndi-logo.png" width="300px">
  <h1>cndi</h1>
  <div>Deploy <strong>Cloud-Native Data Infrastructure</strong> in Minutes</div>
</div>
<br>
<p align="center">
  <a href="https://github.com/polyseam/cndi/actions/workflows/main-latest.yaml">
    <img src="https://github.com/polyseam/cndi/actions/workflows/main-latest.yaml/badge.svg" alt="main" style="max-width: 100%;">
  </a>
  <img src="https://img.shields.io/badge/Dependabot-active-brightgreen.svg" alt="Dependabot Badge">
  <img src="https://img.shields.io/github/languages/code-size/polyseam/cndi" alt="GitHub code size in bytes">
  <img src="https://img.shields.io/github/commit-activity/w/polyseam/cndi" alt="GitHub commit activity">
  <a href="https://github.com/polyseam/cndi/issues">
    <img src="https://img.shields.io/github/issues/polyseam/cndi" alt="GitHub issues">
  </a>
  <a href="https://cndi.run/dl?utm_content=gh_badge_releases&utm_campaign=readme_v1&utm_source=github.com/polyseam/cndi&utm_medium=repo&utm_id=1002">
    <img src="https://img.shields.io/github/v/release/polyseam/cndi.svg?style=flat" alt="GitHub Release">
  </a>
  <a href="https://cndi.run/di?utm_content=gh_badge_discord&utm_campaign=readme_v1&utm_source=github.com/polyseam/cndi&utm_medium=repo&utm_id=1001">
    <img src="https://img.shields.io/discord/956275914596040754.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="Discord">
  </a>
  <a href="https://cndi.run/tw?utm_content=gh_badge_twitter&utm_campaign=readme_v1&utm_source=github.com/polyseam/cndi&utm_medium=repo&utm_id=1000">
    <img src="https://img.shields.io/twitter/follow/Polyseam?label=&style=social" alt="Twitter">
  </a>
</p>

Welcome to CNDI, it deploys an entire data stack in minutes!

It's perfect for deploying data services consistently that are reliable,
discoverable, maintainable, and interoperable, all while remaining flexible to
the needs of each stack.

## installation 🥁

To install CNDI we just need to download the binary and add it to our PATH. This
can be done using the script below:

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

## usage

CNDI is a tool with which to deploy GitOps enabled Kubernetes application
clusters on any platform as quickly and easily as possible. The best way to
understand this process is to look at it as a lifecycle.

### lifecycle: init 🌱

The first step in the lifecycle is to initialize the CNDI project. Because
CNDI's mechanics are based on the GitOps workflow, we should initialize a Git
repository before we do anything else. The best way to do this as a GitHub user
is to use the [gh cli](https://cli.github.com).

```bash
gh repo create cndi-example --private --clone && cd cndi-example
```

Now that we have a Git repository, we can initialize a new CNDI project.

We can do this in 2 different ways, either by using the interactive cli, or by
writing or forking a "cndi-config" file you got from someone else, often named
`cndi-config.jsonc`.

**interactive mode**

The best way to get started if you are new to CNDI is to use the interactive
cli, so let's look at that first.

```bash
# once cndi is in your "PATH" you can run it from anywhere
cndi init --interactive
```

This will start an interactive cli that will ask you a series of questions, the
first is to select a Template. Templates are a CNDI concept, and they can be
thought of as a "blueprint" for a data stack. Once you select a Template, CNDI
will ask you some general questions about your project and some
template-specific questions. Then it will write out a few files inside your
project repo.

**non-interactive mode**

The other way to initialize a CNDI project is to use a `cndi-config.jsonc` file.
There are only 2 reasons to use the non-interactive mode. The first is that you
have a `cndi-config.jsonc` file you found somewhere online which meets your
needs. The second reason to avoid interactive mode is the standard for CLIs: you
are calling `cndi init` from a script, though we can't think of any good reason
to do that.

To use CNDI in non-interactive mode you need a `cndi-config` file and pass that
into cndi. For more information about the structure of this file, checkout the
[config section](#configuration-📝) of this README.

```bash
# if you run `cndi init` without -f we will look for a file named `cndi-config.jsonc` in the current directory
cndi init -f cndi-config.jsonc
```

---

Whether you've chosen to use interactive mode or not, CNDI has generated a few
files and folders for us based on our `cndi-config.jsonc` file. If you want to
learn about what CNDI is really creating, this is the best file to look at.

We break down all of these generated files later in this document in the
[outputs](#outputs-📂) section.

The next step for our one-time project setup is to make sure that we have all
the required envrionment variables for our project. Some of these values are
required for every deployment. For example, you always need to have
`GIT_USERNAME`, `GIT_PASSWORD` and `GIT_REPO`.

Some are only required for certain "deployment targets" like `AWS_ACCESS_KEY_ID`
and `AWS_SECRET_ACCESS_KEY` which are only needed for aws deployments. Lastly,
some are only required for certain Templates, for example all `airflow-tls`
templates require `GIT_SYNC_PASSWORD` for accessing repos that hold Airflow
DAGs.

These environment variables are saved to the `.env` file that CNDI has generated
for us. If you didn't use interactive mode you may have some placeholders in
that file to overwrite, and they should be easy to spot. CNDI should also tell
you if it is missing expected values.

When all of the values have been set, we want to use the
[gh cli](https://github.com/cli/cli) again, this time to push our secret
environment variables to GitHub.

```bash
# cndi requires version 2.23.0 or later of the GitHub CLI
gh secret set -f .env
```

Now we are ready for the next phase of the lifecycle!

---

### lifecycle: push 🚀

Now that we have initialized our project, CNDI has given us files that describe
our infrastructure resources and files that describe what to run on that
infrastructure. CNDI has also created a GitHub Action for us which is
responsible for calling `cndi run`. The `run` command provided in the cndi
binary is responsible for calling `terraform apply` to deploy our
infrastructure.

After `cndi run` has exited successfully you should be able to see new resources
spinning up in the deployment target you selected. When the nodes come online in
that destination, they will join together to form a Kubernetes cluster.

As the nodes join the cluster automatically, they are going to begin sharing
workloads. Some workloads come bundled, we will call these CNDI platform
services. There are a couple such services, one is
[sealed-secrets](https://github.com/bitnami-labs/sealed-secrets), and another is
[ArgoCD](https://argo-cd.readthedocs.io/en/stable/). Sealed Secrets enables
storing Kubernetes Secrets within git securely, and ArgoCD is a GitOps tool
which monitors a repo for Kubernetes manifests, and applies them.

When ArgoCD comes online, it will begin reading files from the
`cndi/cluster_manifests` directory in the GitHub repo we have been pushing to.
Ultimately `cndi run` is only used within GitHub for infrastructure, and ArgoCD
is solely responsible for what to run on the cluster.

Your cluster will be online in no time!

---

### lifecycle: overwrite ♻️

The next phase of the lifecycle is about making changes to your cluster. These
changes can be `cluster_manifests` oriented, if you are making changes to the
software running on your infrastructure, or they can be infrastructure oriented
if you are horizontally or vertically scaling your cluster.

In either case, the approach is the same. Open your `cndi-config.jsonc` file in
your editor and make changes to your `"applications"`, `"cluster_manifests"`, or
`"infrastructure"` then run:

```bash
# shorthand for cndi overwrite
cndi ow
```

Upon execution of the command you should see that some of the files cndi
generated for us before have been modified or supplemented with new files. So
far no changes have been made to our cluster. Just like before we need to push
the changes up for them to take effect. This is what GitOps is all about, we
don't login to our servers to make changes, we simply modify our config, and
`git push`!

With these 3 phases you have everything you need to deploy a data infrastructure
cluster using CNDI and evolve it over time!

---

### lifecycle: destroy 🗑️

All changes to a cluster with CNDI are made the same way, and teardown is no
exception. To destroy your cluster you just need to delete all the files in your
`cndi/terraform` directory, and add one called `destroy.tf`. This empty
terraform file will signal to Terraform that the desired state of the cluster is
nullified, so all that's left is to push that file up to your repository.

---

### Walkthroughs 🥾

We've got a couple of walkthroughs you can follow if you'd like, currently we
have one for our [aws/airflow-tls](docs/walkthroughs/aws/airflow-tls.md) and
[gcp/airflow-tls](docs/walkthroughs/gcp/airflow-tls.md) Templates. If you are
interested in using CNDI, these walkthroughs will be entirely transferrable to
other applications that aren't Airflow.

---

## configuration 📝

Let's run through the 3 parts of a `cndi-config.jsonc` file. This one file is
the key to understanding CNDI, and it's really pretty simple.

### infrastructure.cndi 🏗️

The `"infrastructure"` section is used to define the infrastructure that will
power our cluster. The infrastructure section is broken out into 2 distinct
categories. The first category is `"cndi"`, and it refers to infrastructure
abstractions our team has invented that CNDI exposes for you.

Currently CNDI exposes only one abstraction, the `"nodes"` interface, and it's a
wrapper that simplifies deploying Kubernetes cluster nodes. The CNDI `"nodes"`
interface wraps the compute resources from every deployment target we support.

All `"nodes"` entries are nearly identical, the only difference is the `"kind"`
field which is used to specify the deployment target. These `"node"` resources
and their supporting infrastructure are ultimately provisioned by Terraform, but
we've abstracted a lot of complexity through this interface.

Declaring a node is simple, we give it a name, we give it some specs, and we add
it to the array!

```jsonc
{
  "infrastructure": {
    "cndi": {
      "nodes": [
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
      ]
    }
  },
  ...
}
// tip: we parse this file as JSONC so you can add comments!
```

Currently we have support for `aws`, `azure` and `gcp` nodes. More deployment
targets are on the way!

Just like every other component in CNDI, nodes can be updated in our
`cndi-config.jsonc` and we can call `cndi ow` and push the changes to our git
remote to modify the cluster accordingly.

### infrastructure.terraform 🧱

The second category within `"infrastructure"` is `"terraform"`, and in contrast
to `"cndi"` the infrastructure in this category is not abstracted by CNDI. This
is where you can define any Terraform resources you want to be provisioned
alongside your cluster.

```jsonc
{
  "infrastructure": {
    "cndi":{...},
    "terraform": {
      "resource": {
        "aws_s3_bucket": {
          "my-bucket": {
            "acl": "public-read",
            "bucket": "s3-website-test.hashicorp.com",
            "cors_rule": [
              {
                "allowed_headers": ["*"],
                "allowed_methods": ["PUT", "POST"],
                "allowed_origins": ["https://s3-website-test.hashicorp.com"],
                "expose_headers": ["ETag"],
                "max_age_seconds": 3000
              }
            ]
          }
        }
      }
    }
  }
}
```

💡 You can also use this section to override any of the default Terraform
objects that CNDI deploys.

_Generally, you should be able to customize CNDI resources through the `"cndi"`
section instead._

But, if you do need to patch a Terraform resource CNDI has created for you, you
simply need to match the resource name we have used, and specify the fields you
want to update.

```jsonc
{
  "infrastructure": {
    "cndi": {...},
    "terraform": {
      "resource": {
        "aws_vpc": {
          "cndi_aws_vpc": {
            "cidr_block": "10.0.0.0/24"
          }
        }
      }
    }
  }
}
```

### applications 💽

The next thing we need to configure is the applications that will actually run
on the cluster. With CNDIv1 we focused on making it a breeze to deploy
[Apache Airflow](https://github.com/apache/airflow) in Kubernetes.

Lets see how we accomplish this here in this new and improved CNDI:

```jsonc
{
  "infrastructure": {...},
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

This is built on top of ArgoCD's Application CRDs and Helm Charts. If you have a
Helm Chart, CNDI can deploy it!

### cluster_manifests 📑

The third aspect of a `cndi-config` file is the `"cluster_manifests"` object.
Any objects here will be used as Kubernetes Manifests and they'll be applied to
your cluster through ArgoCD. This gives you full access to all the Kubernetes
systems and APIs.

```jsonc
{
  "infrastructure": {...},
  "applications": {...},
  "cluster_manifests": {// inside the "cluster_manifests" object you can put all of your custom Kubernetes manifests
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

If you are new to Kubernetes and are unsure what any of that meant, don't sweat
it. CNDI is designed to help with that knowledge gap with templates, and you'll
learn along the way too!

Pro tip! 🤫

If you want to add a new Kubernetes Secret to use inside of your Kubernetes
cluster via GitOps, we make this possible by encrypting your secrets with
[sealed-secrets](https://github.com/bitnami-labs/sealed-secrets) so they can
live in your repo securely and be picked up by ArgoCD automatically. To add a
secret to your cluster add the value to your `.env` file and then add a
`"cluster_manifest"` entry like the one below. After that just call `cndi ow` to
seal your secret.

The example below results in sealing the environment variables `"GIT_USERNAME"`
and `"GIT_PASSWORD"`, into the destination secret key names
`"GIT_SYNC_USERNAME"` and `"GIT_SYNC_PASSWORD"` respectively.

```jsonc
{
  "infrastructure": {...},
  "applications": {...},
  "cluster_manifests": {
    "airflow-git-credentials-secret": {
      "apiVersion": "v1",
      "kind": "Secret",
      "metadata": {
        "name": "airflow-git-credentials",
        "namespace": "airflow"
      },
      "stringData": {
        "GIT_SYNC_USERNAME": "$.cndi.secrets.seal(GIT_USERNAME)",
        "GIT_SYNC_PASSWORD": "$.cndi.secrets.seal(GIT_PASSWORD)"
      }
    }
  }
}
```

---

## outputs 📂

When `cndi init` is called there are a few files that it produces:

1. a `cndi-config.jsonc` - autogenerated in interactive mode only, described in
   the [configuration](#configuration) section above

2. a `.github/workflows` folder, with a GitHub Action inside. The workflow is
   mostly just wrapping the `cndi run` command in the CNDI binary executable. As
   such, if you have a different CI system, you can execute the `cndi run`
   command on the binary there instead.

3. a `cndi/terraform` folder, containing the infrastructure resources cndi has
   generated for terraform, which cndi will apply automatically every time
   `cndi run` is executed.

4. a `cndi/cluster_manifests` folder, containing Kubernetes manifests that will
   be installed on your new cluster when it is up and running. This includes
   manifests like `Ingress` from the `"cluster_manifests"` section of your
   `cndi-config.jsonc`.

5. a `cndi/cluster_manifests/applications` folder, which contains a folder for
   each application defined in the `"applications"` section of your
   `cndi-config.jsonc`, and a generated ArgoCD Application CRD inside that
   contains our expertly chosen defaults for that App, and the spefic parameters
   you've specified yourself in the `"applications"` section of your
   `cndi-config.jsonc`.

6. a `.env` file which contains all of your environment variables that CNDI
   relies on, these values must be environment variables that are defined and
   valid when `cndi run` is executed.

7. a `.gitginore` file to ensure secret values never get published as source
   files to your repo

8. a `./README.md` file that explains how you can use and modify these files
   yourself for the lifetime of the cluster

## up and running

### logging into ArgoCD 🔐

ArgoCD's Web UI is a useful tool for visualizing and debugging your cluster
resources. Some of our templates setup Ingress for ArgoCD automatically, if you
don't have an Ingress you can still access it by following our
[port-forwarding doc](docs/port-forwarding.md). Once you can see the login
screen for ArgoCD you can login with the username `admin` and the password we
set for you in your `.env` file under the key `ARGOCD_ADMIN_PASSWORD`.

### dns 🌐

Setting up DNS for your cluster is a critical step if your cluster will be
served online. The solution depends on your "deployment target". We have a doc
coming soon walking through setting up DNS for AWS and GCP coming soon, but in
short you just need to point DNS to the load balancer we provisioned for you. In
AWS this means using a `CNAME` record, or an `A` record for a cluster running on
GCP.

---

## building cndi (contributor guide) 🛠️

If you are hoping to contribute to this project and want to learn the ropes, you
are in the right place. Let's start with setting up your environment:

### setup 🦕

The first step as you might expect is to clone this repo. Take note of where you
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
alias cndi-next="deno run -A --unstable ~/dev/polyseam/cndi/main.ts"
```

If you have any issues please message [Matt](https://github.com/johnstonmatt) or
[Tamika](https://github.com/IamTamika) in the
[Polyseam Discord Chat](https://discord.gg/ygt2rpegJ5).
