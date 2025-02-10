<div align="center">
  <br>
  <h1>cndi</h1>
</div>
<br>
<p align="center">
  <a href="https://github.com/polyseam/cndi/actions/workflows/main-latest.yaml">
    <img src="https://github.com/polyseam/cndi/actions/workflows/main-latest.yaml/badge.svg" alt="main" style="max-width: 100%;">
  </a>
  <img src="https://img.shields.io/badge/Dependabot-active-brightgreen.svg" alt="Dependabot Badge">
  <img src="https://img.shields.io/github/languages/code-size/polyseam/cndi" alt="GitHub code size in bytes">
  <img src="https://img.shields.io/github/commit-activity/w/polyseam/cndi?label=commits" alt="GitHub commit activity">
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

Start with a [Template](https://cndi.dev/templates) for a popular service like
[Airflow](https://cndi.dev/templates/airflow),
[Kafka](https://cndi.dev/templates/kafka), or
[PostgreSQL](https://cndi.dev/templates/postgres) and CNDI will help you deploy
it on your own infrastructure - just as easily as you can sign up for a
cloud-based Platform as a Service.

If you'd like to experiment with CNDI Templates in the browser, you can use
[cndi.dev/configurator](https://cndi.dev/configurator) to get started before
installing the `cndi` CLI.

Visit [cndi.dev/templates](https://cndi.dev/templates) for a full list of
Templates, all available on [aws](https://aws.com),
[gcp](https://cloud.google.com), and [azure](https://azure.microsoft.com).

Once you've found what you're looking for launch the interactive CLI and select
your Template and Deployment Target:

```bash
cndi create <owner>/<repo> && cd <repo>
```

You can also develop your own Templates to provide fill-in-the-blanks style
wizards to your team.

Once your cluster is set up, manage the infrastructure and applications with
ease using GitOps and Infrastructure as Code.

## video 🎥

If you'd like to see an overview of the tool followed by a walkthrough for
setting up an Airflow cluster using CNDI, you can find both here:

<a href="https://cndi.run/why-cndi-1024?utm_content=cndi_readme_yt_thumb_link&utm_campaign=cndi_readme_yt_thumb_link_0&utm_source=github.com/polyseam/cndi&utm_medium=github-readme&utm_id=5115">
  <img src="/docs/img/demo-yt-thumb.png" alt="CNDI Overview" width="360px"/>
</a>

## installation 🥁

<!-- The below table Markdown is outrageous and I'm sorry -->

| Prerequisite                  | Description                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [gh](https://cli.github.com/) | [Official GitHub CLI](https://cli.github.com/) used to create a project repo for you and configure [Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) for use in [GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions). |

---

Install the latest CNDI release on your system using one of the commands below:

Shell (Mac, Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

PowerShell (Windows):

```powershell
irm https://raw.githubusercontent.com/polyseam/cndi/main/install.ps1 | iex
```

For more information check out our [install guide](./docs/install.md).

---

## usage 👩‍💻

Use CNDI to deploy GitOps enabled Kubernetes application clusters on any
platform, as quickly and easily as possible. Every CNDI project starts with a
Template.

### create 🚀

the best way to bootstrap a CNDI project is by using `cndi create`. It's best
because it is easy and interactive, to some folks it may even feel like _too
much magic_ 🪄 but fear not! We will explain everything soon.

We start by picking a CNDI Template, and [airflow](https://airflow.apache.org)
is one of our favourites.

Let's run with that:

```bash
# cndi create johnstonmatt/my-airflow --template airflow && cd my-airflow
cndi create <owner>/<repo> -t airflow && cd <repo>
```

[Airflow](https://airflow.apache.org) is one of the Templates bundled with CNDI,
so we can call it out by name, but Templates are just YAML, so they can also be
loaded from a URL or file path!

When in interactive mode, `cndi` will prompt you for the information a Template
needs step-by-step.

The first prompt `cndi create` displays asks you where you want to store your
project on disk, defaulting to a new folder called `<repo>` in the current
working directory.

There will be a few more prompts that are asked for every new CNDI project,
including asking for GitHub credentials and where you want to deploy your new
cluster.

These prompts are called
[core prompts](https://github.com/polyseam/cndi/tree/main/blocks/cluster/core-prompts.yaml),
and depending how you answer that first set, you'll be shown more prompts. One
of the more important decisions is to choose your cloud provider and cndi
natively supports 4 today: [aws](https://aws.com),
[gcp](https://cloud.google.com/gcp), [azure](https://azure.microsoft.com), and
`dev` for deploying experiments locally.

CNDI shines brightest when deploying to the cloud, so we encourage that if you
have access!

When you are asked for credentials to your deployment target, you can follow the
corresponding setup guide for [AWS](docs/cloud-setup/aws/aws-setup.md),
[GCP](docs/cloud-setup/gcp/gcp-setup.md), or
[Azure](docs/cloud-setup/azure/azure-setup.md).

The last set of questions relate directly to the Template you selected, and
generally it is fine to accept the defaults if you aren't completely familiar
with the stack you are deploying.

---

Once you've answered all of the prompts, CNDI will create a number of project
files and we have a dedicated section that covers the
[CNDI Project Structure](./docs/project-structure.md), but there a couple things
that are important to know now:

1. `cndi create` will create a GitHub repo on your behalf and push the project
   ([files and folders](./docs/project-structure.md)) it generates for you to
   that repo
2. All of your responses that are sensitive are written to a `.env` file, and
   that file will not be included in your repo. Instead, CNDI will push these to
   GitHub for use in automation by using the
   [GitHub Secrets API](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions).
3. CNDI created a file called `.github/workflows/cndi-run.yaml` which will
   trigger any time code is pushed to your repo

The CLI will provide info about the files it is creating for you, then provide a
link to the new repo where you can watch the GitHub Action deployment progress!

---

### overwrite ♻️

After a Template has been initialized with either `cndi init` or `cndi create` ,
CNDI projects are managed from only 2 files:

`.env` : adheres to the dotenv pattern, its .gitignored, it contains all secret
values which must not be included in source control

`cndi_config.yaml` : this file is the center of your CNDI project, it provides
an abstraction which unifies **infrastructure**, **applications**, and
**configuration**.

Though these files are the only ones required to manage your project as a user,
they are not natively understood by Infrastructure as Code tools, and they are
not understood by Kubernetes natively either.

You manage your cluster using `cndi_config.yaml`, but you must transform it into
code that can be processed by [Terraform](https://terraform.io), and manifests
which can be processed by [Kubernetes](https://kubernetes.io) through
[ArgoCD](https://argo-cd.readthedocs.io/en/stable/).

The `cndi overwrite` command is responsible for taking both your `.env` file and
your `cndi_config.yaml` file and transforming them into a set of Kubernetes
manifests, and Terraform objects.

The `cndi_config.yaml` file is structured into 4 main sections:

- metadata - eg. project_name, cndi_version, provider, distribution
- applications - used to define Helm Charts which should be installed and
  configured
- cluster_manifests - used for arbitrary Kubernetes configuration
- infrastructure - used to define infrastructure CNDI exposes and optionally raw
  Terraform objects

The workflow is simple, modify your `cndi_config.yaml` fields and call
`cndi ow`, it will transform your configuration into files which can be
processed by [ArgoCD](https://argo-cd.readthedocs.io/en/stable/) and
[Terraform](https://terraform.io), and it will output the resulting files to the
`./cndi` folder at the root of your repo.

Feel free to examine the result of calling `cndi ow` to better understand how it
works. This can be especially insightful when examining a git diff, but
remember, those files are for machines and you can be productive with CNDI
without ever reading or understanding them - that's by design.

---

### run 🌥️

Once you've made changes using `cndi ow`, the next step is to git push a commit
so that those changes to infrastructure and applications can be applied. The
`.github/workflows/cndi-run.yaml` file we've generated for you is very simple.

The workflow checks to ensure there is no active instance of the workflow in
progress to prevent corruption, it loads the credentials which are required for
the deployment of infrastructure, and then it calls `cndi run`.

The run command is responsible for calling Terraform against all of the objects
in the `./cndi/terraform/` folder, then encrypting and persisting
[Terraform state](https://developer.hashicorp.com/terraform/cli/state) in git.

Calling `cndi run` doesn't do anything directly with the other half of your
config `./cndi/cluster_manifests`, and that is because those manifests are
instead pulled into your cluster by
[ArgoCD](https://argo-cd.readthedocs.io/en/stable/) when it has been
successfully deployed by [Terraform](https://terraform.io).

---

### destroy 🗑️

The last CNDI command you should know about is `cndi destroy`. This command
takes no arguments, and it is responsible for pulling and decrypting Terraform
state, then calling `terraform destroy` for you under the hood, which will blast
away every resource that CNDI has created. Once the command exits successfully,
you can safely delete your git repo or achive it for reference later.

---

## walkthroughs 🥾

We've got a few walkthroughs you can follow if you'd like, one for each
deployment target. These walkthroughs hold your hand through the process of
deploying [Airflow](https://cndi.dev/templates-airflow) to the provider and
distribution of your choice. They include info about how to get credentials,
explanations about prompts, screenshots, and more.

- [eks/airflow](docs/walkthroughs/eks/airflow.md) - AWS EKS
- [gke/airflow](docs/walkthroughs/gke/airflow.md) - GCP GKE
- [aks/airflow](docs/walkthroughs/aks/airflow.md) - Azure AKS
- [dev/airflow](docs/walkthroughs/dev/airflow.md) - Local Development

If you are interested in using CNDI, these walkthroughs will be entirely
transferrable to other applications beyond Airflow!

## configuration 📝

If you understand a `cndi_config.yaml` file, you will be successful in using
CNDI. The file enables configuring existing systems like cert-manager for TLS
certs, external-dns, observability, and ingress. It also enables adding
arbitrary Kubernetes Manifests and Terraform objects, yielding endless
possibilities. To learn about all the configuration options, check out the
[CNDI Config Guide](./docs/config.md) and accompanying jsonschema file.

## project structure 📂

There are a few other files beyond `cndi_config.yaml` which all play a part in
your CNDI project. To learn more about each file `cndi create` generated, check
out [CNDI Project Structure Guide](./docs/project-structure.md).

## functions 🪄

CNDI has support for deploying serverless functions to Kubernetes, to learn more
checkout the [CNDI Functions Guide](./docs/functions.md).

## connecting remotely 🔗

Sometimes you need to connect to your cluster in order to debug applications,
especially if you have not exposed your ArgoCD instance to the internet. To
learn more about how to connect to your cluster, check out
[Connecting Remotely to CNDI Clusters](./docs/connect.md) Guide.

## templates 🏗️

Templates are YAML files which define a relationship between prompts and file
outputs.

CNDI includes a set of Templates out of the box based on the YAML source in
[./templates](./templates), and you can learn more about them on our
[Template Registry](https://www.cndi.dev/templates).

To learn more about building new CNDI Templates and distributing them to your
team, checkout the
[CNDI Template Authoring Guide](./docs/template-authoring.md). To request new
Templates or bump existing requests, check out
[our Template wishlist](https://github.com/orgs/polyseam/projects/6/views/7)

## building cndi 🛠️

If you're hoping to contribute to CNDI, please reach out to
[johnstonmatt](mailto:matt.johnston@polyseam.io)! To learn more about setting up
your development environment and other contributor info, check out
[CNDI Contributor Guide](./docs/contributing.md).

## getting help ❤️

CNDI is in active development and there may be bugs, rough edges, or missing
docs. We are commited to help you succeed with the project. If you need help
reach out however you can.

We aim to maintain a discussion post for every possible exception
[here](https://github.com/orgs/polyseam/discussions/categories/error-message-discussion),
so those are a great place to start, but don't hesitate to create an issue if
you aren't able to find a discussion thread for your error.

We'd love to see you in the
[Polyseam Discord Channel](https://discord.gg/ygt2rpegJ5) too, for help or just
to hang out.
