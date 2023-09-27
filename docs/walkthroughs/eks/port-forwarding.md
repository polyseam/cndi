# Connecting to Amazon Kubernetes Cluster and Port Forwarding Argocd and Airflow Web Server

This guide will walk you through the process of connecting to your Amazon
Kubernetes Service (AKS) cluster using the Aws CLI and then port forwarding the
Arogcd and Airflow web server for local access.

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  installed on your local machine.
- The Kubernetes command-line tool
  [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) which
  allows you to run commands against Kubernetes clusters.

## Steps

**1.Install and Configure `AWS` CLI:**

If you haven't already, you'll need to install and configure the `AWS` CLI. You
can download and set it up by following the instructions in the
[AWS CLI install instructions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions).

**2.Configure Kubernetes CLI (kubectl):**

To interact with an Amazon Elastic Kubernetes Service (EKS) cluster, you need to
fetch the cluster's configuration. You can do this with the AWS CLI:

```bash
aws eks update-kubeconfig --name <cluster_name> --region <region>
```

Replace <cluster_name>, <region> with the actual name and region of your EKS
cluster.

## Port Forwarding the Argocd Server

To port forward the argocd web server to your local machine, use the kubectl
port-forward command. Replace <namespace> and <service-name> with the name of
the Argocd server service and <local-port> with the local port you want to use
(e.g., 8080):

```bash
## This is the format of the port fowarding command
kubectl port-forward -n <namespace> svc/<service-name> <local-port>:80
```

```bash
kubectl port-forward -n argocd svc/argocd-server 8080:80
```

**1. Access the Argocd Web UI:**

You will see a message similar to:

```
Forwarding from 127.0.0.1:8080 -> 8080
```

Let's open the port displayed in the browser:

eg: `http://127.0.0.1:8080`

You should now see a login page for Argocd, and a place to enter a username and
password. The username is `admin` and the password is available in the `.env`
file we created for you under the key `ARGOCD_ADMIN_PASSWORD`.

**2. Terminating the Port Forwarding Session:**

To terminate the port forwarding session, simply press Ctrl+C in your terminal
when you're done using the Argocd web UI.

## Port Forwarding the Airflow WebServer

To port forward the Airflow web server to your local machine, use the kubectl
port-forward command. Replace <namespace> and <service-name>with the name of the
Airflow namespace, Airflow webserver service and <local-port> with the local
port you want to use (e.g., 8081):

```bash
kubectl port-forward -n <namespace> svc/<service-name> <local-port>:8080
```

```bash
kubectl port-forward -n airflow svc/airflow-webserver 8081:8080
```

You will see a message similar to:

```
Forwarding from 127.0.0.1:<local-port> -> 8080
```

**1. Access the Airflow Web UI:**

Let's open the port displayed in the browser:

eg: `http://127.0.0.1:<local-port>`

Open your web browser and go to `http://localhost:8081` to access the Airflow
web interface.

You should now see a login page for airflow, and a place to enter a username and
password. The username is `admin` and the password is `admin`

**2. Terminating the Port Forwarding Session:**

To terminate the port forwarding session, simply press Ctrl+C in your terminal
when you're done using the Airflow web UI.
