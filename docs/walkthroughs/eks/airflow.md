# eks/airflow walkthrough

A guide for using CNDI to deploy a GitOps enabled Airflow cluster on Kubernetes
in Amazon Web Services

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `eks/airflow` Template.
In just a few minutes we will be able to deploy a new Kubernetes cluster to AWS
that has been optimally configured for Airflow, including GitOps with Secrets
management, TLS and High Availibility right out-of-the-box. This framework will
enable quick iteration of infrastructure, applications and manifests in a GitHub
workflow you are already comfortable with.

![cndi cluster](/docs/walkthroughs/eks/img/cndi-cluster-0.png)

## prerequisites ✅

**You will need the following things to get up and running with cndi
successfully:**

- **An AWS cloud account**: cndi will deploy infrastructure within AWS.
  [Here's a guide of how to set up your Amazon Web Services account including roles and permissions](/docs/cloud-setup-guide/aws/aws-setup.md)
- **Your cloud credentials**: cndi will leverage your amazon web services's
  **AWS ACCESS KEY ID** and **AWS_SECRET_ACCESS_KEY**
  [credentials](https://docs.eks.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)
  to deploy resources.

- **A Domain Name**: Because the `eks/airflow` template sets up TLS
  certificates, we need to have a domain on which to apply them. We also need
  access to the domain registrar so we can add a couple `CNAME` records there
  for our cluster Ingresses.

- **A GitHub account**: cndi helps you manage the state of your infrastructure
  using a GitOps workflow, so you'll need a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  with a valid
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).
  -`gh` CLI: The GitHub CLI tool is required for some operations. Please follow
  the installation instructions at
  [GitHub CLI](https://cli.github.com/manual/installation).

## download cndi ⬇️

Run the following command within your terminal to download and install cndi:

> [!NOTE] this command will download the correct binary for your OS

```shell
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
cndi init --interactive
```

You will get an interactive prompt where you'll enter all of the values that
should be supplied for this project:

### Project Setup

- **Cndi Project Name***: _Enter the name of your CNDI project (e.g.,
  "my-cndi-cluster")._
- **Template**: _Choose a template from the following list: [list templates
  here]._

### GitHub Configuration

- **GitHub Username***: _Enter your GitHub username (e.g., "johndoe")._
- **GitHub Repository URL***: _Enter the URL for the GitHub repository that will
  hold all cluster configurations (e.g.,
  "https://github.com/username/repository")._
- **GitHub Personal Access Token***: _Enter the access token for CNDI to access
  your GitHub repository._

### AWS Configuration

- **AWS Region***: _Select the AWS region where the infrastructure will be
  created (e.g., "us-east-1")._
- **AWS Access key ID***: _Enter your AWS access key ID._
- **AWS Secret Access key***: _Enter your AWS secret access key._

### Airflow DAG Storage

- **Git Username for Airflow DAG Storage***: _Enter the GitHub username for
  synchronizing Airflow DAGs._
- **Git Password for Airflow DAG Storage***: _Enter the access token or password
  for DAG synchronization._
- **Git Repo for Airflow DAG Storage***: _Enter the URL for the repository where
  your Airflow DAGs will be stored._

### Domain Configuration

- **Domain name for ArgoCD***: _Enter the domain name where ArgoCD will be
  accessible (e.g., "argocd.example.com")._
- **Domain name for Airflow***: _Enter the domain name where Airflow will be
  accessible (e.g., "airflow.example.com")._

### Certificate and Database Configuration

- **Email for Let's Encrypt***: _Enter the email address for Let's Encrypt
  certificate notifications._
- **PostgreSQL Username for Airflow***: _Enter the username for the Airflow
  database._
- **PostgreSQL Password for Airflow***: _Enter the password for the Airflow
  database._
- **PostgreSQL Database Name for Airflow***: _Enter the name of the PostgreSQL
  database for Airflow._

![AWS instances dashboard](/docs/walkthroughs/eks/img/cndi-init-interactive.png)

This process will generate a `cndi_config.yaml` file, and `cndi` directory at
the root of your repository containing all the necessary files for the
configuration. It will also store all the values in a file called `.env` at the
root of your repository.

The structure of the generated CNDI project will be something like:

```shell
├── 📁 cndi/                              # CNDI project root directory
│   ├── 📁 cluster_manifests/             # Kubernetes cluster manifests
│   │   ├── 📁 applications/              # Application-specific manifests
│   │   │   ├── cnpg.yaml                 # Manifest for CNPG application
│   │   │   ├── external-dns.application.yaml  # External DNS application manifest
│   │   │   └── airflow.application.yaml  # Airflow application manifest
│   │   ├── argo-ingress.yaml             # Argo ingress configuration
│   │   ├── airflow-ingress.yaml          # Airflow ingress configuration
│   │   ├── cert-manager-cluster-issuer.yaml  # Cert-manager cluster issuer
│   │   ├── git-credentials-secret.yaml   # Git credentials secret
│   │   └── etc                           # Other miscellaneous manifests
│   └── 📁 terraform/                     # Terraform configuration files
│       ├── cdk.tf.json                   # Terraform CDK configuration
│       └── etc                           # Other Terraform-related files
├── cndi_config.yaml                      # CNDI configuration file
├── .env                                  # Environment variables
├── .gitignore                            # Ignored files and directories in Git
├── .github/                              # GitHub-specific files (e.g., workflows)
└── README.md                             # Project overview and documentation
```

For a breakdown of all of these files, checkout the
[outputs](/README.md#outputs-📂) section of the repo's main README.

## upload environment variables to GitHub ⬆️

GitHub Actions plays a key role in deploying your cluster by executing the cndi
run command. To ensure the security and accessibility of your secrets during the
actions runtime, it's essential to store them securely and not expose them in
your source code. We achieve this by using GitHub Actions Secrets via the Github
CLI. Install The GitHub CLI [gh](https://cli.github.com/) for convenient method
to set these secrets.

### Authenticate with GitHub

Before using the gh CLI, authenticate with your GitHub account to gain access to
your repositories:

```shell
gh auth login
```

### Set Secrets Using the .env File

Use the gh secret set command to upload your secrets from the .env file to
GitHub Actions. This file should contain all the environment variables required
for your deployment:

```shell
gh secret set -f .env
```

> [!NOTE] if this does not complete the first time, try running it again!

![GitHub secrets](/docs/walkthroughs/eks/img/upload-git-secrets.png)

## deploy your templated cluster configration 🚀

After you have created your configuration files and uploaded the necessary
environment variables to GitHub, it's time to push your configuration to your
GitHub repository. Follow these steps to ensure a smooth deployment:

```shell
git add .
git commit -m "initial commit"
git push --set-upstream origin main
```

You should now see the cluster configuration has been uploaded to GitHub:

![GitHub repo](/docs/walkthroughs/eks/img/github-repo.png)

Now, open your web browser and navigate to your project on GitHub. Click on the
Actions tab, then click on the job that was triggered from your latest commit.

You will see something like the image below, which shows that GitHub has
successfully run the workflow.

![GitHub action](/docs/walkthroughs/eks/img/github-action.png)

It is common for `cndi run` to take a fair amount of time, as is the case with
most Terraform and cloud infrastructure deployments.

Once `cndi run` has been completed, at the end of the run will be a link to
`resource groups`, where you can view resources deployed by CNDI for this
project. ![cndi outputs](/docs/walkthroughs/eks/img/outputs.png)

Click on your project resource group to see the resources you have created in
the project

![resource groups root page](/docs/walkthroughs/eks/img/resource-groups.png)

## Optional attach the load balancer to your domain 🌐

At the end of the cndi run there is also an output called `public host`. This is
the DNS (CNAME) of the load balancer attached to your EKS instances, which
you'll use to connect your custom domain to your cluster's services.

![cndi outputs](/docs/walkthroughs/eks/img/outputs.png)

- Copy `public host` output
- login into the management console of your domain registrar (e.g., GoDaddy,
  Google Domains) where you have your custom domain.
- Create an CNAME record to route traffic to the load balancer IP address
  `public host` for Airflow and Argocd at the domain you provided.

![google domains](/docs/walkthroughs/eks/img/google-domains-cname.png) After the
DNS records have propagated (which may take up to a few minutes), open the
domain name you've assigned for applications like ArgoCD and Airflow in your
browser. You should see the respective login pages.

## (Optional: Port Forwarding Without a Custom Domain)

If you don't have a custom domain, you can still access your deployed
applications by port forwarding:
[Here's a guide of how to connect to your EKS Kubernetes Cluster once its deployed and Port Forward Argocd and the Airflow Web Server](/docs/walkthroughs/eks/port-forwarding.md)

## Logging Into ArgoCD:

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

![.env file](/docs/walkthroughs/eks/img/argocd-admin-password.png)
![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-0.png)

After logging in, you can verify that the cluster_manifests in your GitHub
repository match the configurations in the ArgoCD UI.

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-1.png)

```shell
└── 📁 cndi
   └── 📁 cluster_manifests
       ├── 📁 applications
       │   ├── airflow.application.yaml
       │   ├── cnpg.yaml
       │   ├── external-dns.application.yaml  
       │   └── airflow.application.yaml  
       ├────── git-credentials-secret.yaml
       ├────── cert-manager-cluster-issuer.yaml
       ├────── argo-ingress.yaml
       └────── etc
```

Verify all applications and manifests in the GitHub repository are present and
their status is healthy in the ArgoCD UI

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-2.png)

## verify that Airflow is accessible on the chosen domain 🧐

After setting up your Airflow application on the chosen domain, it is necessary
to verify that Airflow is accessible. To do this, the user can simply go to the
chosen domain and see if they can see Airflow's login page. The default username
is `admin` and the password is `admin`. If the page is accessible, then the user
can log in and begin using Airflow. If not, the user should go back and make
sure the previous steps were done correctly.

![Airflow UI](/docs/walkthroughs/eks/img/airflow-ui-0.png)

## verify Airflow is connected to the private DAG repository 🧐

Verify that Airflow is connected to the private DAG repository. If correct, the
private DAGs should be visible on the Airflow UI. If not,you should go back and
make sure that the private DAG repository is properly connected to Airflow with
the correct credentials:

![Airflow UI](/docs/walkthroughs/eks/img/airflow-ui-1.png)

## and you are done! ⚡️

You now have a fully-configured 3-node Kubernetes cluster with TLS-enabled
Airflow and Argocd

## modifying the cluster! 🛠️

**To add another a node to the cluster:**

![cndi config](/docs/walkthroughs/eks/img/cndi_config.png)

- Go to the `cndi_config.yaml`
- In the `infrastructure.cndi.nodes` section, add increase the number of nodes
  and save the file
- Run `cndi ow`
- Commit changes
- Push your code changes to the repository

## destroying resources in the cluster! 💣

**If you just want to take down any of your individual applications:**

- Delete that application or manifest from your `cndi_config.yaml`
- Run `cndi ow`
- Commit changes
- Push your code changes to the repository

**If you want to take down the entire cluster run:**

```bash
cndi destroy
```
