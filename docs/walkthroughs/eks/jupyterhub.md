# eks/jupyterhub walkthrough

A guide for using CNDI to deploy a GitOps enabled Jupyterhub cluster on
Kubernetes in Amazon Web Services

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `eks/jupyterhub`
Template. In just a few minutes we will be able to deploy a new Kubernetes
cluster to AWS that has been optimally configured for Jupyterhub, including
GitOps with Secrets management, TLS and High Availibility right out-of-the-box.
This framework will enable quick iteration of infrastructure, applications and
manifests in a GitHub workflow you are already comfortable with.

![cndi cluster](/docs/walkthroughs/eks/img/cndi-cluster-0.png)

## prerequisites ✅

**You will need the following things to get up and running with cndi
successfully:**

- **An AWS cloud account**: cndi will deploy infrastructure within AWS

- **Your cloud credentials**: cndi will leverage your amazon web services's
  **AWS ACCESS KEY ID** and **AWS_SECRET_ACCESS_KEY**
  [credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)
  to deploy resources.

- **A Domain Name**: Because the `eks/jupyterhub` template sets up TLS
  certificates, we need to have a domain on which to apply them. We also need
  access to the domain registrar so we can add a couple `CNAME` records there
  for our cluster Ingresses.

- **A GitHub account**: cndi helps you manage the state of your infrastructure
  using a GitOps workflow, so you'll need a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  with a valid
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

- [Here's a guide of how to set up your Amazon Web Services account](/docs/cloud-setup-guide/eks/aws-setup.md)

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
cndi init --interactive
```

You will get an interactive prompt where you'll name your project, then one to
specify the CNDI template you want.

For this project select the `eks/jupyterhub` Template.

```shell
? Pick a template
   aws/basic
   gcp/basic
   azure/basic
 ❯ eks/jupyterhub
   azure/jupyterhub
   gcp/jupyterhub
```

Below is the list of all of the interactive prompt values that should be
supplied for this project:

- **Cndi Project Name**: _name of project_
- **Template**: _list of templates to choose from_

---

- **GitHub Username**: _a user's handle on GitHub._
- **GitHub Repository URL**: _the url for the GitHub repository that will hold
  all cluster configuration_
- **GitHub Personal Access Token**: _the access token CNDI will use to access
  your repo for cluster creation and synchronization_

---

- **AWS Access key ID**: _access keys are long-term credentials for an IAM user_
- **AWS Secret Access key**: _access keys are long-term credentials for an IAM
  user_
- **AWS Region**: _region where the infastructure is being created_

---

- **Domain name you want ArgoCD to be accessible on**: _domain where ArgoCD will
  be hosted_
- **Domain name you want Jupyterhub to be accessible on**: _domain where
  Jupyterhuh will be hosted_
- **Email address you want to use for lets encrypt:** _an email for lets encrypt
  to use when generating certificates_

![AWS instances dashboard](/docs/walkthroughs/eks/img/cndi-init-interactive.png)

This process will generate a `cndi-config.json` file, and `cndi` directory at
the root of your repository containing all the necessary files for the
configuration. It will also store all the values in a file called `.env` at the
root of your repository.

The structure of the generated CNDI project will be as follows:

```shell
├── 📁 cndi
│   ├── 📁 cluster_manifests
│   │   ├── 📁 applications
│   │   │   └── jupyterhub.application.json
│   │   ├── argo-ingress.json
│   │   ├── cert-manager-cluster-issuer.json
│   │   └── git-credentials-secret.json
│   └── 📁 terraform
│       ├── x-jupyterhub-node.cndi-node.tf.json
│       ├── y-jupyterhub-node.cndi-node.tf.json
│       ├── z-jupyterhub-node.cndi-node.tf.json
│       └── etc 
├── cndi-config.jsonc
├── .env
├── .gitignore
├── .github
└── README.md
```

For a breakdown of all of these files, checkout the
[outputs](/README.md#outputs-📂) section of the repo's main README.

## upload environment variables to GitHub ⬆️

GitHub Actions is responsible for calling the `cndi run` command to deploy our
cluster, so it is important that our secrets are available in the actions
runtime. However we don't want these to be visible in our source code, so we
will use GitHub Actions Secrets to store them. The
[gh](https://github.com/cli/cli) CLI makes this very easy.

```shell
gh secret set -f .env
# if this does not complete the first time, try running it again!
```

![GitHub secrets](/docs/walkthroughs/eks/img/upload-git-secrets.png)

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

You should now see the cluster configuration has been uploaded to GitHub:

![GitHub repo](/docs/walkthroughs/eks/img/github-repo.png)

Now, open your web browser and navigate to your project on GitHub. Click on the
Actions tab, then click on the job that was triggered from your latest commit.

You will see something like the image below, which shows that GitHub has
successfully run the workflow.

![GitHub action](/docs/walkthroughs/eks/img/github-action.png)

It is common for `cndi run` to take a fair amount of time, as is the case with
most Terraform and cloud infrastructure deployments.

Once `cndi run` has been completed, you should be ready to log into AWS to find
the IP address of the load balancer that we created for you in the Network tab.

---

## attach the load balancer to your domain 🌐

- Go to [AWS EC2 console](https://console.aws.amazon.com/ec2/)
- In the navigation pane, choose **Load Balancers**
- Select the **Load Balancer** thats attached to your EC2 instances
- Copy that Load Balancer's **DNS Name** (CNAME record)

![google domains](/docs/walkthroughs/eks/img/jupyterhub-ingress.png)

Go to your custom domain, you will need to add a CNAME record for your domain
and add the DNS Name of your load balancer to it

![google domains](/docs/walkthroughs/eks/img/google-domains-cname.png) Open the
domain name you've assigned for ArgoCD in your browser to see the Argo Login
page.

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

![.env file](/docs/walkthroughs/eks/img/argocd-admin-password.png)

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-1.png)

Notice that the `cluster_manifests` in the GitHub repository matches config in
the ArgoCD UI

```shell
└── 📁 cndi
   └── 📁 cluster_manifests
       ├── 📁 applications
       │   └── jupyterhub.application.json
       ├────── git-credentials-secret.json
       ├────── cert-manager-cluster-issuer.json
       └────── argo-ingress.json
```

Verify all applications and manifests in the GitHub repository are present and
their status is healthy in the ArgoCD UI

![Argocd UI](/docs/walkthroughs/eks/img/argocd-ui-2.png)

## verify that Jupyterhub is accessible on the chosen domain 🧐

After setting up your Jupyterhub application on the chosen domain, it is
necessary to verify that Jupyterhub is accessible. To do this, the user can
simply go to the chosen domain and see if they can see Jupyterhub's login page.
The default username is `admin` and the password is `admin`. If the page is
accessible, then the user can log in and begin using Jupyterhub. If not, the
user wait, should go back and make sure the previous steps were was done
correctly.

![Jupyterhub UI](/docs/walkthroughs/eks/img/jupyterhub-ui-1.png)
![Jupyterhub UI](/docs/walkthroughs/eks/img/jupyterhub-ui-2.png)

## and you are done! ⚡️

You now have a fully-configured 3-node Kubernetes cluster with Jupyterhub and
Argocd

## destroying resources in the cluster! 💣

**If you just want to take down any of your individual applications:**

- Delete that application or manifest from your `cndi-config.jsonc`
- Run `cndi ow`
- Commit changes
- Push your code changes to the repository

**If you want to take down the entire cluster run:**

```bash
cndi destroy
```
