# eks/airflow walkthrough

A guide for using CNDI to deploy a GitOps enabled Airflow cluster on Kubernetes
in Amazon Web Services

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `airflow` Template to
Amazon's [EKS](https://aws.amazon.com/eks/). In just a few minutes we will be
able to deploy a new Kubernetes cluster to AWS that has been optimally
configured for Airflow, including GitOps with Secrets management, TLS and High
Availibility right out-of-the-box. This framework will enable quick iteration of
infrastructure, applications and manifests in a GitHub workflow you are already
comfortable with.

![cndi cluster](/docs/walkthroughs/eks/img/cndi-cluster-0.png)

## prerequisites ✅

Before you start using CNDI, ensure you have the following prerequisites set up.
These are necessary to successfully deploy and manage your infrastructure using
CNDI:

- **AWS Cloud Account**: You'll need an active AWS account as CNDI deploys
  infrastructure within Amazon Web Services.

- **AWS Credentials**: CNDI requires your AWS Access Key ID and AWS Secret
  Access Key to authenticate and deploy resources. Learn how to obtain your
  credentials from the
  [official AWS documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey).

- **Domain Name**: For easy access to your cluster, attach a domain name to the
  load balancer. Provide this domain during the `cndi create` command, and CNDI
  will configure it automatically.

- **GitHub Account**: Manage your infrastructure's state using a GitOps
  workflow. Ensure you have a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  and a
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
  set up.

- **GitHub CLI**: Install the GitHub Command Line Interface (CLI) to interact
  with GitHub from your terminal. Download it from the
  [GitHub CLI page](https://cli.github.com/).

- **AWS Setup Guide**: For a detailed guide on setting up your Amazon Web
  Services account, including roles and permissions, refer to our
  [AWS Setup Documentation](/docs/cloud-setup/aws/aws-setup.md).

## download cndi ⬇️

### macos and linux

Installing for macOS and Linux is the way to go if you have that option. Simply
run the following:

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

### windows

Installing for Windows should be just as easy. Here is the command to install
CNDI on Windows:

```powershell
irm https://raw.githubusercontent.com/polyseam/cndi/main/install.ps1 | iex
```

## create your cndi project 📂

CNDI is designed around a GitOps workflow, so all of your cluster configuration
and infrastructure will be stored as code within a git repo, let's create that
now!

```shell
# cndi create <owner>/<repo> && cd <repo>

 cndi create polyseam/my-cndi-cluster && cd my-cndi-cluster
```

my-cndi-cluster You will first be prompted to enter the name of your cndi
project

```
Please enter a name for your CNDI project: (my-cndi-cluster)
```

When you're prompted to choose a template for your project, select the airflow
template.

```shell
"Pick a template"
  basic
❯ airflow 
  cnpg
  neo4j
  mssqlserver
```

Make sure airflow is highlighted and press Enter to confirm your selection.

Next, you'll need to decide where you want to deploy your cluster. For this
project, choose aws if you're deploying to Amazon Web Services, The prompt will
appear as follows:

```shell
"Where do you want to deploy your cluster?"
❯ aws 
  azure
  gcp
  dev
```

Ensure `aws` is highlighted and press Enter to proceed.

Finally, select a Kubernetes distribution for your deployment. The `eks`
(Elastic Kubernetes Service) option is for deploying on AWS, offering a managed
Kubernetes service that simplifies running Kubernetes applications. The prompt
will be:

```shell
Select a distribution
❯ eks
```

After confirming that `eks` is highlighted, press `Enter` to finalize your
choice. You will then need to provide specific information at various
interactive prompts. Below is a comprehensive list of the prompts used during
this init process:

#### Project Setup:

- **Cndi Project Name**: Specify the name of your project.
- **Template**: Choose from a provided list of templates, each tailored to
  different project needs.

#### GitHub Configuration:

- **GitHub Username**: Your GitHub handle.
- **GitHub Repository URL**: The URL of the GitHub repository for storing all
  cluster configurations.
- **GitHub Personal Access Token**: An access token allowing CNDI to interact
  with your repository for cluster creation and synchronization.

#### AWS Credentials:

- **AWS Access Key ID**: Long-term credentials for an IAM user.
- **AWS Secret Access Key**: Long-term credentials for an IAM user.
- **AWS Region**: The AWS region where the infrastructure will be deployed.

#### Airflow DAG Storage:

- **Git Username for Airflow DAG Storage**: Your GitHub handle for syncing
  Airflow DAGs.
- **Git Password for Airflow DAG Storage**: A personal access token for DAG
  synchronization.
- **Git Repo for Airflow DAG Storage**: The URL of the repository where your
  Airflow DAGs will be stored.

#### Domain Configuration:

- **Domain for ArgoCD**: The domain where ArgoCD will be accessible.
- **Domain for Airflow**: The domain where Airflow will be accessible.

#### Security and Database:

- **Email for Lets Encrypt**: An email address for Lets Encrypt to use when
  generating certificates.
- **Username for Airflow CNPG Database**: The username for accessing the Airflow
  database.
- **Password for Airflow CNPG Database**: The password for accessing the Airflow
  database.
- **Name of the PostgreSQL Database for Airflow CNPG**: The name of the
  PostgreSQL database for the Airflow CNPG database.

This process will generate a `cndi_config.yaml` file, and `cndi` directory at
the root of your repository containing all the necessary files for the
configuration. It will also store all the values in a file called `.env` at the
root of your repository.

The structure of the generated CNDI project will be something like:

```shell
├── 📁 cndi
│   ├── 📁 cluster_manifests
│   │   ├── 📁 applications
|   |   |   ├── cnpg.yaml 
│   │   │   └── airflow.application.yaml
│   │   ├── argo-ingress.yaml
│   │   ├── cert-manager-cluster-issuer.yaml
│   │   ├── git-credentials-secret.yaml
│   │   └── etc
│   └── 📁 terraform
│       ├── airflow-nodes.cndi-node.tf.yaml
│       └── etc 
├── cndi_config.yaml
├── .env
├── .gitignore
├── .github
└── README.md
```

```
cndi create polyseam/my-cndi-cluster

Please confirm the destination directory for your CNDI project: »  (C:\Users\Taylor\polyseam\my-cndi-cluster)
Please enter a name for your CNDI project: (my-cndi-cluster) » my-cndi-cluster
Pick a template » airflow
Where do you want to deploy your cluster? » aws
Select a distribution » eks
Would you like ArgoCD to connect to your repo using a Git token or SSH key? » token
What is your git username? () » IamTamika
Please enter your Git Personal Access Token: () » ****************************
Please enter your Git Repo URL: () »
What email address should be used for Lets Encrypt certificate registration?  » tamika.taylor@untribe.com
Would you like to enable external-dns for automatic DNS management? (Y/n) » Yes
Please select your DNS provider (aws) » aws
Please enter your AWS Access Key ID: () »  *****************   
Please enter your AWS Secret Access Key: () » ******************
Please enter your AWS Region: (us-east-1) » us-east-1 
Do you want to expose ArgoCD with an Ingress? (Y/n) » Yes
What hostname should ArgoCD be accessible at? » argocd.untribe.com
Do you want to expose the Airflow UI to the web? (Y/n) » Yes
What hostname should Airflow be accessible at? » airflow.untribe.com
What is the URL of the Git repository containing your Airflow DAGs? (https://github.com/polyseam/demo-dag-bag) » https://github.com/polyseam/demo-dag-bag
Do you want to use your cluster credentials for Airflows Git Sync? (Y/n) » Yes

created cndi cluster repo at https://github.com/polyseam/my-cndi-cluster
```

Once complete you should click on the link of the newly created repo cluster,
and scroll down to the readme for more infomation about about your airflow
deployment

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

## attach the Load Balancer to Your Domain 🌐 with ExternalDNS

Instead of manually creating a CNAME record in your domain's DNS settings, if
you enabled & configured ExternalDNS during the cndi init process then
ExternalDNS will automatically create a CNAME record in Route 53, pointing to
your load balancer's public host. This process eliminates the need for manual
DNS record management.If everything is working correctly you should now open the
domain name you've assigned for ArgoCD in your browser to see the ArgoCD login
page. The DNS changes may take a few minutes to propagate

- (Optional if you dont have an domain name)
  [Here's a guide of how to connect to your EKS Kubernetes Cluster once its deployed and Port Forward Argocd and the Airflow Web Server](/docs/walkthroughs/eks/port-forwarding.md)

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

<details >
<summary>
Attach the load balancer to your domain manually (Optional)
</summary>
<div>

At the end of the cndi run there is also an output called `resource groups`,
which will have Cluster which has the loadbalancer url . Copy the CNAME
address(public host) of the loadbalancer thats attached to your EKS instances.

![cndi outputs](/docs/walkthroughs/eks/img/outputs.png)
![airflow ingress](/docs/walkthroughs/eks/img/airflow-ingress.png)

- Copy `public host`
- Go to your custom domain,
- Create an CNAME record to route traffic to the load balancer IP address
  `public host` for Airflow and Argocd at the domain you provided.

![google domains](/docs/walkthroughs/eks/img/google-domains-cname.png)

If everything is working correctly you should now open the domain name you've
assigned for ArgoCD in your browser to see the ArgoCD login page. The DNS
changes may take a few minutes to propagate.

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

</div>

</details>

<br>

![.env file](/docs/walkthroughs/eks/img/argocd-admin-password.png)

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-1.png)

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

![cndi config](/docs/walkthroughs/eks/img/cndi-config.png)

- Go to the `cndi_config.yaml`
- In the `infrastructure.cndi.nodes` section, add a new airflow node and save
  the file
- Run `cndi ow`
- `Add`, `commit` and `push` the config to your GitHub repository:

```shell
git add .
git commit -m "add instance"
git push
```

## destroying resources in the cluster! 💣

**If you just want to take down any of your individual applications:**

- Delete that application or manifest from your `cndi_config.yaml`
- Run `cndi ow`
- `Add`, `commit` and `push` the config to your GitHub repository:

```shell
git add .
git commit -m "add instance"
git push
```

**If you want to take down the entire cluster run:**

```bash
cndi destroy
```
