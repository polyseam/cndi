# gcp/airflow-tls walkthrough

A guide for using CNDI to deploy a GitOps enabled Airflow cluster on Kubernetes
in Google Cloud Platform

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `gcp/airflow-tls`
Template. In just a few minutes we will be able to deploy a new Kubernetes
cluster to GCP that has been optimally configured for Airflow, including GitOps
with Secrets management, TLS and High Availibility right out-of-the-box. This
framework will enable quick iteration of infrastructure, applications and
manifests in a GitHub workflow you are already comfortable with.

![cndi cluster](/docs/walkthroughs/gcp/img/cndi-cluster-0.png)

## prerequisites ✅

**You will need the following things to get up and running with cndi
successfully:**

- **A GCP account and a GCP project**: cndi will deploy infrastructure into a
  [Google Cloud](https://console.cloud.google.com) Project connected to a valid
  billing account.

- **Your GCP service account credentials**: cndi will leverage a Google Cloud
  Service Account using a **service-account-key.json**
  [credentials](https://cloud.google.com/iam/docs/service-accounts) file to
  deploy resources.

- **A Domain Name**: Because the `gcp/airflow-tls` template sets up TLS
  certificates, we need to have a domain on which to apply them. We also need
  access to the domain registrar so we can add a couple `A` records there for
  our cluster Ingresses.

- **A GitHub account**: cndi helps you manage the state of your infrastructure
  using a GitOps workflow, so you'll need a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  with a valid
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

## download cndi ⬇️

Run the following command within your terminal to download and install cndi:

```shell
# this will download the correct binary for your OS
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

## create your cndi repository 📂

CNDI is designed around a GitOps workflow, so all of your cluster configuration
and infrastructure will be stored as code within a git repo, let's create that
now!

```bash
gh repo create my-cndi-cluster --private --clone && cd my-cndi-cluster
```

## creating cluster config with cndi templates using the interactive cli 🛠️

Now that we have a repo, let's use `cndi` to generate all of our Infrastructure
as Code and Cluster Configuration:

```shell
cndi init -i
```

You will get an interactive prompt where you'll name your project, then one to
specify the CNDI template you want.

For this project select the `gcp/airflow-tls` Template.

```shell
? Pick a template
   aws/basic
   gcp/basic
   aws/airflow-tls
 ❯ gcp/airflow-tls
```

Below is the list of all of the interactive prompt values that should be
supplied for this project:

- **Cndi Project Name**: _name of project_
- **Template**: _list of templates to choose from_
- **GitHub Username**: _a user's handle on GitHub._
- **GitHub Repository URL**: _the url for the GitHub repository that will hold
  all cluster configuration_
- **GitHub Personal Access Token**: _the access token CNDI will use to access
  your repo for cluster creation and synchronization_
- **GCP Region**: _region where the infastructure is being created_
- **Path to GCP service account key json**: _path to JSON credentials file for
  GCP Service Account_
- **Git Username for Airflow DAG Storage**: _a user's handle on GitHub used to
  synchronize Airflow DAGs_
- **Git Password for Airflow DAG Storage**: _a personal access token used to
  synchronize Airflow DAGs_
- **Git Repo for Airflow DAG Storage**: _url for repo where your Airflow DAGs
  will be stored_
- **Domain name you want ArgoCD to be accessible on**: _domain where ArgoCD will
  be hosted_
- **Domain name you want Airflow to be accessible on**: _domain where Airflow
  will be hosted_
- **Email address you want to use for lets encrypt:** _an email for lets encrypt
  to use when generating certificates_

![GCP instances dashboard](/docs/walkthroughs/gcp/img/cndi-init-interactive.png)

This process will generate a `cndi-config.jsonc` file, and `cndi` directory at
the root of your repository containing all the necessary cluster and
infrastructure resources. It will also generate a `.env` file that will be used
to store sensitive information that we don't want to commit to our repository as
source code.

The structure of the generated CNDI project will be as follows:

```shell
├── 📁 cndi
│   ├── 📁 cluster_manifests
│   │   ├── 📁 applications
│   │   │   └── airflow.application.json
│   │   ├── argo-ingress.json
│   │   ├── cert-manager-cluster-issuer.json
│   │   └── git-credentials-secret.json
│   └── 📁 terraform
│       ├── x-airflow-node.cndi-node.tf.json
│       ├── y-airflow-node.cndi-node.tf.json
│       └── z-airflow-node.cndi-node.tf.json
├── cndi-config.jsonc
├── .env
├── .gitignore
├── .github
└── README.md
```

For a breakdown of all of these files, checkout the
[outputs](/README.md#outputs-📂) section of the repo's main README.

## upload environment variables to GitHub ⬆️

GitHub actions is responsible for calling the `cndi run` command to deploy our
cluster, so it is important that our secrets are available in the actions
runtime. However we don't want these to be visible in our source code, so we
will use GitHub secrets to store them. The [gh](https://github.com/cli/cli) CLI
makes this very easy.

```shell
gh secret set -f .env
```

![GitHub secrets](/docs/walkthroughs/gcp/img/upload-git-secrets.png)

---

## deploy your templated cluster configration 🚀

Once all the config is created and environment variables are uploaded to GitHub,
add, commit and push the config to your GitHub repository:

```shell
git add .
git status # take a quick look and make sure these are all files you want to push
git commit -m "initial commit"
git push --set-upstream origin main
```

You should now see the cluster configuration has loaded to GitHub:

![GitHub repo](/docs/walkthroughs/gcp/img/github-repo.png)

Now, open your web browser and navigate to your project on GitHub. Click on the
Actions tab, then click on the job that was triggered from your latest commit.

You will see something like the image below, which shows that GitHub has
successfully run the workflow.

![GitHub action](/docs/walkthroughs/gcp/img/github-action.png)

It is common for `cndi run` to take a fair amount of time, as is the case with
most Terraform and cloud infrastructure deployments.

Once `cndi run` has been completed, you should be ready to log into GCP to find
the IP address of the load balancer that we created for you in the Network tab.

---

## attach the load balancer to your domain 🌐

- Go to [GCP network services console](https://cloud.google.com/net-services)
- In the navigation pane, choose **Load Balancing**
- Select the **Load Balancer** thats attached to your GCP Cluster
- Copy that Load Balancer's IP in the **Addresses** section

![GCP nlb](/docs/walkthroughs/gcp/img/gcp-nlb.png)

Next we want to wire up DNS so that our domain points to the load balancer,
which will in turn route traffic into our cluster.

- Create an A record to route traffic to the load balancer IP address for
  Airflow at the domain you provided.
- Create an A record to route traffic to the load balancer IP address for ArgoCD
  at the domain you provided.

![Google Domains](/docs/walkthroughs/gcp/img/google-domains-a-record.png)

---

## Get Argo Credentials 🗝️

- In the navigation pane, choose VM Instances.
- Select a instance and click on the SSH button to connect

![GCP instances dashboard](/docs/walkthroughs/gcp/img/gcp-instances-ui.png)

Go to the ArgoCD domain URL that you specified in the interactive prompt

![Argocd UI](/docs/walkthroughs/aws/img/argocd-ui-0.png)

You should now see a login page for Argocd, you will need the username is
`admin` and the password which is the value of the `ARGOCD_ADMIN_PASSWORD` in
the `.env` located in your CNDI project folder

![.env file](/docs/walkthroughs/aws/img/argocd-admin-password.png)

Notice that the `cluster_manifests` stored in the GitHub repository match the
resources displayed in the ArgoCD UI

```shell
└── 📁 cndi
   └── 📁 cluster_manifests
       ├── 📁 applications
       │   └── airflow.application.json
       ├────── git-credentials-secret.json
       ├────── cert-manager-cluster-issuer.json
       └────── argo-ingress.json
```

Verify all applications and manifests in the GitHub repository are present and
their status is healthy in the Argocd UI

![Argocd UI](/docs/walkthroughs/gcp/img/argocd-ui-2.png)

## verify that Airflow is accessible on the chosen domain 🧐

After setting up your Airflow application on the chosen domain, it is necessary
to verify that Airflow is accessible. To do this, the user can simply go to the
chosen domain and see if they can see Airflow's login page. The default username
is `admin` and the password is `admin`. If the page is accessible, then the user
can log in and begin using Airflow. If not, the user wait, should go back and
make sure the previous steps were was done correctly.

![Airflow UI](/docs/walkthroughs/gcp/img/airflow-ui-0.png)

## Verify Airflow is connected to the private DAG repository 🧐

Verify that Airflow is connected to the private dag repository. If correct, the
private dags should be visible on the Airflow UI. If not,you should go back and
make sure that the private dag repository is properly connected to Airflow with
the correct credentials

![Airflow UI](/docs/walkthroughs/gcp/img/airflow-ui-1.png)

## and you are done! ⚡️

You now have a fully-configured 3-node Kubernetes cluster with TLS-enabled
Airflow and Argocd

## destroying resources in the cluster! 💣

**If you just want to take down any of your individual applications:**

- Delete that application or manifest from your cndi-config.jsonc
- Run cndi ow
- Commit changes
- Push your code changes to the repository

**If you want to take down the entire cluster run:**

```bash
cndi destroy
```
