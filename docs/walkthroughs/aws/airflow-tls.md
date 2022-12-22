---
title: aws/airflow-tls walkthrough
description: >-
  A guide to getting up and running with cndi using our cli 
---

# 🧐 overview

This is a guide on how to get cndi running using our CLI and pre-generated templates. By using the default setting you will create a 3-node cluster running TLS-enabled Airflow and ArgoCD.

![cndi cluster](/docs/walkthroughs/aws/img/cndi-cluster-0.png)

# ✅ prerequisites

**You will need the following things to get up and running with cndi successfully:**

* **A cloud account**: cndi will deploy directly into your cloud provider of choice. We currently support AWS and GCP. Follow [this guide](/reference/configuring-cloud-provider) to make sure it's set up correctly.

* **Your cloud credentials**: cndi will leverage your amazon web services's **AWS ACCESS KEY ID** and **AWS_SECRET_ACCESS_KEY**  [credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey) to deploy resources.

* **A DNS provider**: cndi creates a load balancer so you'll need an attach the dns of the load balancer to 

* **A GitHub account**: cndi manages the state of your infrastructure using a git-ops workflow, so you'll need an [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account) with a valid [GitHub token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

# ⬇️  download cndi 

Run this command within your terminal to download cndi:
```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

> #### **Note** 💡
>  *if you are on windows you should run this in 'git bash'*   


# ⚙️ install cndi cli

Run this command within the directory that you want to store your configuration in:
```bash
cndi init -i
```
# 📂 create your cndi repository

cndi stores all your cndi cluster configurations within a Git repository. 

Run this command within the directory that you want to store your configuration in:

```bash
gh repo create my-cndi-cluster --private --clone
```

# 🛠️ creating cluster config with cndi templates

You will get an interactive prompt where you'll specify relevant values for your project (or the default value will be used).

* **Cndi Project Name**:
* **Template**: *list of templates to choose from*
* **GitHub Username**: *a user's handle on GitHub.*
* **GitHub Repository URL**: *place where your code is stored: a repository on GitHub*
* **GitHub Personal Access Token**: *alternative to using passwords for authentication to GitHub*
* **AWS Access key ID**: *access keys are long-term credentials for an IAM user*
* **AWS Secret Access key**: *access keys are long-term credentials for an IAM user*
* **AWS Region**: *region where the infastructure is being created*
* **Git Username for Airflow DAG Storage**:*a user's handle on GitHub.*
* **Git Password for Airflow DAG Storage**:*place where your code is stored: a repository on GitHub*
* **Domain name you want argocd to be accessible on**: *domain where argocd will be hosted*
* **Domain name you want airflow to be accessible on**: *domain where airflow will be hosted*
* **Email address you want to use for lets encrypt:**

![Aws instances dashboard](/docs/walkthroughs/aws/img/cndi-init-interactive.png)

This process will generate a `cndi-config.json` file, and `cndi` directory at the root of your repository that stores your cloud provider configuration information.
It will also store all the values in a file called `.env` at the root of your repository 

The structure of the generated templated project will be as follows:
```
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
# ⬆️ upload environment variables to GitHub

Upload your environment variables in the .env file to the GitHub Actions workflow

```bash
gh secret set -f .env
```
![GitHub secrets](/docs/walkthroughs/aws/img/upload-git-secrets.png)
# 🚀 deploy your templated cluster config 

Once all the config is created and environment variables are uploaded to GitHub, add, commit and push the code to your GitHub repository:

```bash
git add .
git status 
git commit -m "initial commit"
git push
```
You should now see the cluster configuration has loaded to GitHub:

![GitHub repo](/docs/walkthroughs/aws/img/github-repo.png)

Now, open your web browser and navigate to your project on GitHub. Click on the Actions tab, then click on your current commit.

You will see something like the image below, which shows that GitHub has successfully run the workflow.

![GitHub action](/docs/walkthroughs/aws/img/github-action.png)

It is common for `cndi run` to take a fair amount of time, as is the case with most Terraform and cloud infrastructure deployments. 

Once `cndi run` has been completed, you should be ready to log into AWS to connect your application through the load balancer at the domain you specified in the interactive prompt.

# 🤝 attach the load balancer to your domain 

* Go to [AWS EC2 console](https://console.aws.amazon.com/ec2/). 
* In the navigation pane, choose **Load Balancers**.
* Select the **Load Balancer** thats attached to your EC2 instances.
* Copy that Load Balancer's **DNS Name** (CNAME record)

![Aws nlb](/docs/walkthroughs/aws/img/aws-nlb.png)

Go to your custom domain, you will need to add a CNAME record for your domain and add the DNS Name of your load balancer to it. 

![google domains](/docs/walkthroughs/aws/img/google-domains-cname.png)

# 🤝 Connect to an node in your cluster

* Go to [AWS EC2 console](https://console.aws.amazon.com/ec2/). 
* In the navigation pane, choose Instances.
* Select a instance and choose Connect.
* Choose EC2 Instance Connect.
* Verify the user name and choose Connect to open a terminal window

![Aws instances dashboard](/docs/walkthroughs/aws/img/aws-instances-ui.png)

![Aws instances dashboard](/docs/walkthroughs/aws/img/aws-connect.png)


In order to login to Argocd, we have to get the password from within the cluster. 
Run the command below in the terminal of one of the cluster nodes:

```bash
sudo microk8s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```
save that password and then go to the Argocd domain URL that you specified in the interactive prompt 

You should now see a login page for Argocd, and a place to enter a username and password. The username is `admin` and the password is the text you copied in the previous step.
![Argocd UI](/docs/walkthroughs/aws/img/argocd-ui-0.png)

![Argocd UI](/docs/walkthroughs/aws/img/argocd-ui-1.png)

Verify all applications and manifests in the GitHub repository are present and their status is healthy in the argocd UI

```
├── 📁 cndi
   ├── 📁 cluster_manifests
       ├── 📁 applications
       │   └── airflow.application.json
       ├────── git-credentials-secret.json
       ├────── cert-manager-cluster-issuer.json
       └────── argo-ingress.json
```

![Argocd UI](/docs/walkthroughs/aws/img/argocd-ui-2.png)

# 🧐 Verify that Airflow is accessible on the chosen domain.

You should now see a login page for Airflow:  
The username is `admin` and the password is `admin`

![Airflow UI](/docs/walkthroughs/aws/img/airflow-ui-0.png)

# 🧐 Verify Airflow is connected to the private dag repository 

You should now see the dags located in a different private repo inside the Airflow UI

![Airflow UI](/docs/walkthroughs/aws/img/airflow-ui-1.png)

# ⚡️ and you are done!
You now have a fully-configured 3-node Kubernetes cluster with TLS-enabled airflow and Argocd

![completed cndi cluster](/docs/walkthroughs/aws/img/cndi-cluster-1.png)

# 💣 destroying resources in the cluster!

**If you want to take down any of your individual applications:**
* Delete that application or manifest from your cndi-config.jsonc
* Run cndi ow
* Commit changes 
* Push your code changes to the repository

**If you want to take down the entire cluster:**
* Delete all the files in your cndi/terraform directory
* Create an empty called destroy.tf in the cndi/terraform directory
* Commit changes 
* Push your code changes to the repositorysitory
