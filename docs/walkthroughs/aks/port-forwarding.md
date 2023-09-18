# Connecting to Azure Kubernetes Cluster and Port Forwarding Argocd and Airflow Web Server

This guide will walk you through the process of connecting to your Azure
Kubernetes Service (AKS) cluster using the Azure CLI and then port forwarding
the Airflow web server for local access.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
  installed on your local machine.
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

## Steps

**1.Install Azure CLI:**

Install Azure CLI: If you haven't already, install the Azure CLI on your local
machine. You can download and install it from here.

**2.Login to Azure:**

Open your terminal or command prompt and run the following command to log in to
your Azure account:

```bash
az login
```

**2. Configure Kubernetes CLI (kubectl):**

If you haven't configured kubectl to use your Kubernetes cluster, you can do so
using the following command. Replace <subscription_id>, <resource-group-name>
and <cluster-name> with your cluster's details:

Set the cluster subscription

```bash
az account set --subscription <subscription_id>
```

Download cluster credentials

```bash
az aks get-credentials --resource-group <resource-group-name> --name <cluster-name>
```

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
