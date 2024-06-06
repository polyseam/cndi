# aks/airflow walkthrough

A guide for using CNDI to deploy a GitOps enabled Airflow cluster on Kubernetes
in AKS (Azure Kubernetes Service)

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `airflow` Template to
[Azure AKS](https://azure.microsoft.com/en-ca/products/kubernetes-service). In
just a few minutes we will be able to deploy a new Kubernetes cluster to Azure
that has been optimally configured for Airflow, including GitOps with Secrets
management, TLS and High Availibility right out-of-the-box. This framework will
enable quick iteration of infrastructure, applications and manifests in a GitHub
workflow you are already comfortable with.

![cndi cluster](/docs/walkthroughs/aks/img/cndi-cluster-0.png)

## prerequisites ✅

**You will need the following things to get up and running with CNDI
successfully:**

- **An Azure cloud account**: CNDI will deploy infrastructure within AKS

- **Your cloud credentials**: cndi will leverage your AKS web services's
- ARM_CLIENT_SECRET
- ARM_CLIENT_ID
- ARM_TENANT_ID
- ARM_SUBSCRIPTION_ID

- **A domain name**: The most convenient way to access your cluster is by
  attaching a domain name to the load balancer, if you provide this domain
  during `cndi create` in an upcoming step we should be able to wire it up
  automatically.

- (Optional if you dont have an domain name)
  [Here's a guide of how to connect to your Azure Kubernetes Cluster once its deployed and Port Forward ArgoCD and the Airflow Web Server](docs/walkthroughs/aks/port-forwarding.md)

- **A GitHub account**: cndi helps you manage the state of your infrastructure
  using a GitOps workflow, so you'll need a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  with a valid
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

- **GitHub CLI**: You will need to have the GitHub CLI installed on your
  machine. You can download it [here](https://cli.github.com/).

- [Here's a guide of how to set up your Azure account including roles and permissions](/docs/cloud-setup/azure/azure-setup.md)

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

Make sure `airflow` is highlighted and press Enter to confirm your selection.

Next, you'll need to decide where you want to deploy your cluster. For this
project, choose `azure` if you're deploying to Microsoft, The prompt will appear
as follows:

```shell
"Where do you want to deploy your cluster?"
  aws 
❯ azure
  gcp
  dev
```

Ensure `azure` is highlighted and press Enter to proceed.

Finally, select a Kubernetes distribution for your deployment. The `aks` option
is for deploying on Azure, offering a managed Kubernetes service that simplifies
running Kubernetes applications. The prompt will be:

```shell
Select a distribution
❯ aks
```

After confirming that `aks` is highlighted, press `Enter` to finalize your
choice. You will then need to provide specific information at various
interactive prompts. Below is a comprehensive list of the prompts used during
this init process:

- **Cndi Project Name**: _name of project_
- **Template**: _list of templates to choose from_

---

- **GitHub Username**: _a user's handle on GitHub._
- **GitHub Repository URL**: _the url for the GitHub repository that will hold
  all cluster configuration_
- **GitHub Personal Access Token**: _the access token CNDI will use to access
  your repo for cluster creation and synchronization_

---

- **Azure Subscription ID**: _access keys are long-term credentials for an IAM
  user_
- **Azure Client ID**: _access keys are long-term credentials for an IAM user_
- **Azure Client Secret**: _region where the infastructure is being created_
- **Azure Tenant ID**: _access keys are long-term credentials for an IAM user_
- **Azure Region**: _region where the infastructure is being created_

---

- **Git Username for Airflow DAG Storage**: _a user's handle on GitHub used to
  synchronize Airflow DAGs_
- **Git Password for Airflow DAG Storage**: _a personal access token used to
  synchronize Airflow DAGs_
- **Git Repo for Airflow DAG Storage**: _url for repo where your Airflow DAGs
  will be stored_

---

- **Domain name you want ArgoCD to be accessible on**: _domain where ArgoCD will
  be hosted_
- **Domain name you want Airflow to be accessible on**: _domain where Airflow
  will be hosted_

---

- **Email address you want to use for lets encrypt:** _an email for lets encrypt
  to use when generating certificates_
- **Username you want to use for airflow cnpg database:** _username you want to
  use for airflow database_
- **Password you want to use for airflow cnpg database:** _password you want to
  use for airflow database_
- **Name of the postgresql database you want to use for airflow cnpg database:**
  _name of the postgresql database you want to use for airflow cnpg database_

This process will generate a `cndi_config.yaml` file, and `cndi` directory at
the root of your repository containing all the necessary files for the
configuration. It will also store all the values in a file called `.env` at the
root of your repository.

The structure of the generated CNDI project will be something like this:

```shell
├── 📁 cndi
│   ├── 📁 cluster_manifests
│   │   ├── 📁 applications
│   │   │   └── airflow.application.json
│   │   ├── argo-ingress.json
│   │   ├── cert-manager-cluster-issuer.json
│   │   └── git-credentials-secret.json
│   └── 📁 terraform
│       ├── airflow-nodes.cndi-node.tf.json
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
Where do you want to deploy your cluster? » azure
Select a distribution » aks
Would you like ArgoCD to connect to your repo using a Git token or SSH key? » token
What is your git username? () » IamTamika
Please enter your Git Personal Access Token: () » ****************************
Please enter your Git Repo URL: () »
What email address should be used for Lets Encrypt certificate registration?  » tamika.taylor@untribe.com
Would you like to enable external-dns for automatic DNS management? (Y/n) » Yes
Please select your DNS provider (azure) » azure
Please enter your Azure Subscription ID: () »  *****************   
Please enter your Azure Client ID: () » ******************
Please enter your Azure Client Secret: () »  *****************   
Please enter your Azure Tenant ID: () » ******************
Please enter your Azure Region: (us-east-1) » us-east-1 
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

![GitHub repo](/docs/walkthroughs/aks/img/github-repo.png)

Now, open your web browser and navigate to your project on GitHub. Click on the
Actions tab, then click on the job that was triggered from your latest commit.

You will see something like the image below, which shows that GitHub has
successfully run the workflow.

![GitHub action](/docs/walkthroughs/aks/img/github-action.png)

It is common for `cndi run` to take a fair amount of time, as is the case with
most Terraform and cloud infrastructure deployments.

Once `cndi run` has been completed, at the end of the run will be a link to
`resource groups`, where you can view resources deployed by CNDI for this
project.

![current resource group](/docs/walkthroughs/aks/img/resource-groups.png)

---

## attach the Load Balancer to Your Domain 🌐 with ExternalDNS

Instead of manually creating a CNAME record in your domain's DNS settings, if
you enabled & configured ExternalDNS during the cndi init process then
ExternalDNS will automatically create A record in your domain registar, pointing
to your load balancer's public host. This process eliminates the need for manual
DNS record management. If everything is working correctly you should now open
the domain name you've assigned for ArgoCD in your browser to see the ArgoCD
login page. The DNS changes may take a few minutes to propagate

- (Optional if you dont have an domain name)
  [Here's a guide of how to connect to your AKS Kubernetes Cluster once its deployed and Port Forward Argocd and the Airflow Web Server](/docs/walkthroughs/aks/port-forwarding.md)

![Argocd UI](/docs/walkthroughs/aks/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

<details >
<summary>
Attach the load balancer to your domain manually (Optional)
</summary>
<div>

At the end of the cndi run there is also an output called `resource groups`,
which will have public loadbalancer. Copy the IP address(public host) of the
loadbalancer thats attached to your AKS instances.

![cndi outputs](/docs/walkthroughs/aks/img/outputs.png)
![AKS LB](/docs/walkthroughs/aks/img/azure-nlb.png)

- Copy `public host`
- Go to your custom domain,
- Create an A record to route traffic to the load balancer IP address
  `public host` for Airflow and Argocd at the domain you provided.

![google domains](/docs/walkthroughs/aks/img/google-domains-a-record.png)

If everything is working correctly you should now open the domain name you've
assigned for ArgoCD in your browser to see the ArgoCD login page. The DNS
changes may take a few minutes to propagate.

![Argocd UI](/docs/walkthroughs/aks/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

</div>

</details>

<br>

![.env file](/docs/walkthroughs/aks/img/argocd-admin-password.png)

![Argocd UI](/docs/walkthroughs/aks/img/argocd-ui-1.png)

Verify all applications and manifests in the GitHub repository are present and
their status is healthy in the ArgoCD UI

![Argocd UI](/docs/walkthroughs/aks/img/argocd-ui-2.png)

## verify Airflow is connected to the private DAG repository 🧐

Verify that Airflow is connected to the private DAG repository. If correct, the
private DAGs should be visible on the Airflow UI. If not,you should go back and
make sure that the private DAG repository is properly connected to Airflow with
the correct credentials:

![Airflow UI](/docs/walkthroughs/aks/img/airflow-ui-1.png)

## and you are done! ⚡️

You now have a fully-configured 3-node Kubernetes cluster with TLS-enabled
Airflow and ArgoCD.

## modifying the cluster! 🛠️

**To add another a node to the cluster:**

![cndi config](/docs/walkthroughs/aks/img/cndi-config.png)

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
git commit -m "destroy instance"
git push
```

**If you want to take down the entire cluster run:**

```bash
cndi destroy
```
