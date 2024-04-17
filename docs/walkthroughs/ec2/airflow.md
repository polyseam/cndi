# ec2/airflow walkthrough

A guide for using CNDI to deploy a GitOps enabled Airflow cluster on Kubernetes
in Amazon Web Services

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `aws/airflow` Template.
In just a few minutes we will be able to deploy a new Kubernetes cluster that
has been optimally configured for Airflow, including GitOps with Secrets
management, TLS and High Availibility right out-of-the-box. This framework will
enable quick iteration of infrastructure, applications and manifests in a GitHub
workflow you are already comfortable with.

![cndi cluster](/docs/walkthroughs/ec2/img/cndi-cluster-0.png)

## prerequisites ✅

**You will need the following things to get up and running with cndi
successfully:**

- **An AWS cloud account**: cndi will deploy infrastructure within AWS

- **Your cloud credentials**: cndi will leverage your amazon web services's
  **AWS ACCESS KEY ID** and **AWS_SECRET_ACCESS_KEY**
  [credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)
  to deploy resources.

- **A Domain Name**: Because the `ec2/airflow` template sets up TLS
  certificates, we need to have a domain on which to apply them. We also need
  access to the domain registrar so we can add a couple `CNAME` records there
  for our cluster Ingresses.

- **A GitHub account**: cndi helps you manage the state of your infrastructure
  using a GitOps workflow, so you'll need a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  with a valid
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

- [Here's a guide of how to set up your Amazon Web Services account including roles and permissions](/docs/cloud-setup-guide/ec2/aws-setup.md)

## download cndi ⬇️

Run the following command within your terminal to download and install cndi:

```shell
# this will download the correct binary for your OS
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

## create your cndi project 📂

CNDI is designed around a GitOps workflow, so all of your cluster configuration
and infrastructure will be stored as code within a git repo, let's create that
now!

```shell
cndi create <owner>/my-repo && cd my-repo
```

You will first be prompted to enter the name of your cndi project

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

Finally, select a Kubernetes distribution for your deployment. The `microk8s`
(Elastic Kubernetes Service) option is for deploying on AWS, offering a
unmanaged Kubernetes service that simplifies running Kubernetes applications.
The prompt will be:

```shell
Select a distribution
❯ microk8s
  eks
```

## After confirming that `microk8s` is highlighted, press `Enter` to finalize your choice. You will then need to provide specific information at various interactive prompts. Below is a comprehensive list of the prompts used during this init process:

## deploy your templated cluster configration 🚀

Once all the config is created and environment variables are uploaded to GitHub,
add, commit and push the config to your GitHub repository:

```shell
git add .
git status # take a quick look and make sure these are all files you want to push
git commit -m "initial commit"
git push --set-upstream origin main
```

You should now see the cluster configuration has been uploaded to GitHub:

![GitHub repo](/docs/walkthroughs/ec2/img/github-repo.png)

Now, open your web browser and navigate to your project on GitHub. Click on the
Actions tab, then click on the job that was triggered from your latest commit.

You will see something like the image below, which shows that GitHub has
successfully run the workflow.

![GitHub action](/docs/walkthroughs/ec2/img/github-action.png)

It is common for `cndi run` to take a fair amount of time, as is the case with
most Terraform and cloud infrastructure deployments.

Once `cndi run` has been completed, at the end of the run will be a link to
`resource groups`, where you can view resources deployed by CNDI for this
project. ![cndi outputs](/docs/walkthroughs/ec2/img/outputs.png)

![resource groups root page](/docs/walkthroughs/ec2/img/resource-groups-root.png)

![current resource group](/docs/walkthroughs/ec2/img/resource-groups.png)

## attach the Load Balancer to Your Domain 🌐 with ExternalDNS

Instead of manually creating a CNAME record in your domain's DNS settings, if
you enabled & configured ExternalDNS during the cndi init process then
ExternalDNS will automatically create a CNAME record in Route 53,

At the end of the cndi run there is also an output called `public host`, which
is the **DNS** (CNAME) of your newly created load Balancer.

![cndi outputs](/docs/walkthroughs/ec2/img/outputs.png)

- Copy `public host`
- Go to your cndi_config.yaml

- Find your the argocd and airflow ingresses uncomment the following line and
  replace the value with your load balancer hostname
  external-dns.alpha.kubernetes.io/target:
  <my-loadbalancer.us-east-1.elb.amazonaws.com>

Add, commit and push the config to your GitHub repository:

```shell
git add .
git commit -m "updating ingress"
git push
```

This process eliminates the need for manual DNS record management. If everything
is working correctly you should now open the domain name you've assigned for
ArgoCD in your browser to see the ArgoCD login page. The DNS changes may take a
few minutes to propagate

- (Optional if you dont have an domain name)
  [Here's a guide of how to connect to your Kubernetes Cluster once its deployed and Port Forward Argocd and the Airflow Web Server](/docs/port-forwarding.md)

![Argocd UI](/docs/walkthroughs/ec2/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

<details >
<summary>
Attach the load balancer to your domain manually (Optional)
</summary>
<div>

At the end of the cndi run there is also an output called `public host`, which
is the **DNS** (CNAME) of the load Balancer thats attached to your instances.

![cndi outputs](/docs/walkthroughs/ec2/img/outputs.png)

- Copy `public host`
- Go to your custom domain,
- Create an CNAME record to route traffic to the load balancer IP address
  `public host` for Airflow and Argocd at the domain you provided.

![google domains](/docs/walkthroughs/ec2/img/google-domains-cname.png)

If everything is working correctly you should now open the domain name you've
assigned for ArgoCD in your browser to see the ArgoCD login page. The DNS
changes may take a few minutes to propagate.

- (Optional if you dont have an domain name)
  [Here's a guide of how to connect to your Kubernetes Cluster once its deployed and Port Forward Argocd and the Airflow Web Server](/docs/port-forwarding.md)

![Argocd UI](/docs/walkthroughs/ec2/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

![.env file](/docs/walkthroughs/ec2/img/argocd-admin-password.png)

</div>

</details>

<br>

![.env file](/docs/walkthroughs/ec2/img/argocd-admin-password.png)

![Argocd UI](/docs/walkthroughs/ec2/img/argocd-ui-1.png)

Verify all applications and manifests in the GitHub repository are present and
their status is healthy in the ArgoCD UI

![Argocd UI](/docs/walkthroughs/ec2/img/argocd-ui-2.png)

## verify that Airflow is accessible on the chosen domain 🧐

After setting up your Airflow application on the chosen domain, it is necessary
to verify that Airflow is accessible. To do this, the user can simply go to the
chosen domain and see if they can see Airflow's login page. The default username
is `admin` and the password is `admin`. If the page is accessible, then the user
can log in and begin using Airflow. If not, the user should go back and make
sure the previous steps were done correctly.

![Airflow UI](/docs/walkthroughs/ec2/img/airflow-ui-0.png)

## verify Airflow is connected to the private DAG repository 🧐

Verify that Airflow is connected to the private DAG repository. If correct, the
private DAGs should be visible on the Airflow UI. If not,you should go back and
make sure that the private DAG repository is properly connected to Airflow with
the correct credentials:

![Airflow UI](/docs/walkthroughs/ec2/img/airflow-ui-1.png)

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

![cndi-run action](/docs/walkthroughs/ec2/img/add-node.png)

![ec2 instances](/docs/walkthroughs/ec2/img/ow.png)

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
