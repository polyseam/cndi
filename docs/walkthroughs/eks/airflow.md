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

- **An AWS cloud account**: cndi will deploy infrastructure within AWS

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

- [Here's a guide of how to set up your Amazon Web Services account including roles and permissions](/docs/cloud-setup-guide/aws/aws-setup.md)

## download cndi ⬇️

Run the following command within your terminal to download and install cndi:

> [!NOTE] this will download the correct binary for your OS

```shell
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
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
  microk8s
❯ eks
```

After confirming that `eks` is highlighted, press `Enter` to finalize your
choice. You will then need to provide specific information at various
interactive prompts. Below is a comprehensive list of the prompts used during
this init process:

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

At the end of the cndi run there is also an output called `public host`, which
is the **DNS** (CNAME) of the load Balancer thats attached to your EKS
instances.

![cndi outputs](/docs/walkthroughs/eks/img/outputs.png)

- Copy `public host`
- Go to your custom domain,
- Create an CNAME record to route traffic to the load balancer IP address
  `public host` for Airflow and Argocd at the domain you provided.

![google domains](/docs/walkthroughs/eks/img/google-domains-cname.png)

If everything is working correctly you should now open the domain name you've
assigned for ArgoCD in your browser to see the ArgoCD login page. The DNS
changes may take a few minutes to propagate.

- (Optional if you dont have an domain name)
  [Here's a guide of how to connect to your EKS Kubernetes Cluster once its deployed and Port Forward Argocd and the Airflow Web Server](/docs/walkthroughs/eks/port-forwarding.md)

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

![.env file](/docs/walkthroughs/eks/img/argocd-admin-password.png)

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

![cndi config](/docs/walkthroughs/ec2/img/cndi-config.png)

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
