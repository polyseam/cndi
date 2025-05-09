# dev/airflow walkthrough

A guide for using CNDI to deploy a GitOps enabled Airflow cluster on Kubernetes
in Local Development enviroment.

> [!NOTE]
> Using `cndi` to deploy a cluster locally is the least reliable way to deploy
> because every computer is different. As always, if you run into issues please
> reach out to us on [discord](https://cndi.run/di?utm_id=5116)!

## overview 🔭

This walkthough uses `cndi` to customize and deploy our `airflow` Template with
the `dev/microk8s` deployment target. In just a few minutes we will be able to
deploy a new Kubernetes cluster to your dev environment that has been optimally
configured for Airflow, including GitOps with Secrets management, right
out-of-the-box. This framework will enable quick iteration of infrastructure,
applications and manifests in a GitHub workflow you are already comfortable
with.

![cndi cluster](/docs/walkthroughs/dev/img/cndi-cluster-0.png)

## prerequisites ✅

**You will need the following things to get up and running with cndi
successfully:**

- **Multipass**: [Download Multipass](https://multipass.run/install) for
  Windows, Linux or Mac

- **A GitHub account**: cndi helps you manage the state of your infrastructure
  using a GitOps workflow, so you'll need a
  [GitHub account](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account)
  with a valid
  [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

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
cndi create -t airflow -l dev/microk8s
```

You will get an interactive prompt where you'll name your project, then you'll
be prompted for all the necessary values to create the cluster configuration.

Below is the list of all of the interactive prompt values that should be
supplied for this project:

- **Cndi Project Name**: _name of project_

---

- **GitHub Owner**: _a user or org's handle on GitHub._
- **GitHub Repository name**: _the name of the GitHub repository CNDI creates to
  hold all cluster configuration and automation_
- **GitHub Personal Access Token**: _the access token CNDI will use to access
  your repo for cluster creation and synchronization_

---

- **Git Username for Airflow DAG Storage**: _a user's handle on GitHub used to
  pull Airflow DAGs_
- **Git Password for Airflow DAG Storage**: _a personal access token used to
  pull Airflow DAGs_
- **Git Repo for Airflow DAG Storage**: _url for repo where your Airflow DAGs
  will be stored_

---

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

The structure of the generated CNDI project will be as follows:

```shell
├── README.md
├── cndi 📁
│   ├── cluster_manifests 📁
│   │   ├── Chart.yaml
│   │   ├── airflow-fernet-key-secret.yaml
│   │   ├── airflow-ns.yaml
│   │   ├── airflow-webserver-key-secret.yaml
│   │   ├── applications 📁
│   │   │   ├── airflow.application.yaml
│   │   │   ├── cert-manager.application.yaml
│   │   │   ├── cnpg.application.yaml
│   │   │   ├── external-dns.application.yaml
│   │   │   ├── kube-prometheus-stack.application.yaml
│   │   │   ├── loki.application.yaml
│   │   │   ├── promtail.application.yaml
│   │   │   └── reloader.application.yaml
│   │   ├── argo-ingress.yaml
│   │   ├── cert-manager-cluster-issuer.yaml
│   │   ├── cnpg-cluster-superuser-auth-secret.yaml
│   │   ├── cnpg-cluster.yaml
│   │   ├── cnpg-database-user-auth-secret.yaml
│   │   ├── git-sync-credentials-secret.yaml
│   │   ├── observability-namespace.yaml
│   │   └── postgresql-connection-string-secret.yaml
│   ├── ks_checks.json
│   └── terraform 📁
│       ├── cdk.tf.json
│       ├── microk8s-cloud-init-leader.yml.tftpl
│       └── microk8s-cloud-init-worker.yml.tftpl
├── cndi_config.yaml
└── cndi_responses.yaml
```

For a breakdown of all of these files, checkout
[docs/project-structure.md](/docs/project-structure.md)

---

## deploy your templated cluster configration 🚀

Once all the config is created and environment variables are uploaded to GitHub,
add, commit and push the config to your GitHub repository:

```shell
git add .
git status # take a quick look and make sure these are all files you want to push
git commit -m "initial commit"
git push --set-upstream origin main
cndi run
```

Two actions will take place

1. You should now see the cluster configuration has been uploaded to GitHub:
   ![GitHub repo](/docs/walkthroughs/dev/img/github-repo.png)

2. The terminal will show the clsuter being created and it will also output the
   instructions on how to access the argocd ui
   ![terraform outputs](/docs/walkthroughs/dev/img/terraform-outputs.png)

## Access the ArgoCD UI 🌐

Now, you need to set up port forwarding to access the ArgoCD and airflow web
server from your local machine. Open a new terminal on your local machine (not
within the Multipass instance) and run the following command to display the IP
address of the dev Multipass instance.

```
# run `cndi show-outputs` to display your version of this command
multipass exec $YOUR_NODE_NAME -- ip route get 1.2.3.4 | awk '{print $7}' | tr -d '\\n'
```

> [!WARNING] If you're using MacOS and you're having trouble with Multipass,
> ensure that your terminal has Local Network access. You can do this by going
> to `System Preferences > Privacy & Security > Local Network` and checking the
> box next to your terminal application.

In the terminal on your local machine, run the port forward command using the IP
address obtained from the previous step:

```
multipass exec $YOUR_NODE_NAME -- sudo microk8s kubectl port-forward
svc/argocd-server -n argocd 8080:443 --address <ip address of node>
```

Using the web browser on your local machine, now access ArgoCD by navigating to
http://<ip address of node>:8080

![Argocd UI](/docs/walkthroughs/dev/img/argocd-ui-0.png)

To log in, use the username `admin` and the password which is the value of the
`ARGOCD_ADMIN_PASSWORD` in the `.env` located in your CNDI project folder

![.env file](/docs/walkthroughs/dev/img/argocd-admin-password.png)

![ArgoCD UI](/docs/walkthroughs/dev/img/argocd-ui-1.png)

Notice once inside the ArgoCD UI that the `cluster_manifests` in the GitHub
repository matches config in the ArgoCD UI

```shell
└── 📁 cndi
   └── 📁 cluster_manifests
       ├── 📁 applications
       │   └── airflow.application.yaml
       └────── git-credentials-secret.yaml
```

Verify all applications and manifests in the GitHub repository are present and
their status is healthy in the ArgoCD UI

![ArgoCD UI](/docs/walkthroughs/dev/img/argocd-ui-2.png)

## verify that Airflow app is healthy 🧐

To do this, the user can simply go to the go to the ArgoCD UI and check Airflow
status or they can can try to port forward the Airflow webserver and see if they
can see Airflow's login page. The command to port forward the airflow ui is:

```
multipass exec ${node.name} -- sudo microk8s kubectl port-forward
svc/airflow-webserver -n airflow 8081:8080 --address <ip address of node>
```

Using the web browser on your local machine, now access Airflow by navigating to
http://<ip address of node>:8081

The default username is `admin` and the password is `admin`. If the page is
accessible, then the user can log in and begin using Airflow. If not, the user
wait, should go back and make sure the previous steps were was done correctly.

![Airflow UI](/docs/walkthroughs/dev/img/airflow-ui-0.png)

## verify Airflow is connected to the private DAG repository 🧐

Verify that Airflow is connected to the private DAG repository. If correct, the
private DAGs should be visible on the Airflow UI. If not,you should go back and
make sure that the private DAG repository is properly connected to Airflow with
the correct credentials:

![Airflow UI](/docs/walkthroughs/dev/img/airflow-ui-1.png)

## and you are done! ⚡️

You now have a fully-configured single node Kubernetes cluster with Airflow and
ArgoCD

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
