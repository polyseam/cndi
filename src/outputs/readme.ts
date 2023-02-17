import { GetReadmeStringArgs } from "../templates/Template.ts";

const coreReadmeSection = `
This project was created with [CNDI](https://github.com/polyseam/cndi), and this README is to help show you the ropes.

## files and directories

### cndi/cluster_manifests

All files in the [cndi/cluster_manifests](/cndi/cluster_manifests) folder are Kubernetes manifests. These are the files that will be applied to your Kubernetes cluster when it is deployed and ready using ArgoCD.

### cndi/terraform

All files in the [cndi/terraform](/cndi/terraform) folder are [Terraform](https://terraform.io) Resource files. These are the files that will be used to provision your cloud infrastructure, as well as configure the virtual machines to join your cluster as they come online.

### .github

The files within the [.github](/.github) folder are the workflows that run within [GitHub Actions](https://docs.github.com/en/actions) to call the \`cndi run\` command when you push to the \`"main"\` branch.

### .env

The [.env](/.env) file is where you can set environment variables that will be used by the \`cndi\` commands. These variables are used to configure the Terraform resources and Kubernetes manifests. This file can contain secrets, because it will not be committed to your repository. It comes pre-populated with a few generated values, but there are a couple you must set yourself too. This file is present in the [.gitignore](/.gitignore) file, so it will not be committed to your repository.

### .gitignore

The [.gitignore](/.gitignore) file is where you can set files and directories that you do not want to be committed to your repository. This file comes pre-populated with a list of files that we know contain secret information.

## usage

Now that you've ran \`cndi init\` and have a project, the next step is to set your environment variables in the [.env](/.env) file. Once you've done that you can use the GitHub CLI to set these variables as [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets?tool=cli).

### secret setup

\`\`\`bash
# this gh cli command sets .env variables as GitHub Actions Secrets
gh secret set -f .env
\`\`\`

### push to GitHub, trigger \`cndi run\`

The next step is to just push your repo up to GitHub!

\`\`\`bash
git add .
git commit -m "initial commit"
git push
\`\`\`

Now that you have pushed to the \`"main"\` branch, the [/.github/workflows/cndi-run.yaml](/.github/workflows/cndi-run.yaml) workflow will run, and call the \`cndi run\` command. This will deploy your cluster to the cloud, and then apply the Kubernetes manifests to it.

### updating your cluster

Now that you have a cluster, you can update it by:

1. modifying your [cndi-config.jsonc](/cndi-config.jsonc) file
2. running \`cndi ow\` 
3. pushing all files to the \`"main"\` branch again

If you've modified your nodes, the infrastructure should be updated with Terraform. If you've modified your Kubernetes manifests, the changes to the manifests will be applied to the cluster.

`.trim();

export default function getReadmeForProject({
  project_name,
  kind,
}: GetReadmeStringArgs): string {
  const linkToDashboards = {
    aws:
      "[AWS EC2 Dashboard](https://console.aws.amazon.com/ec2/home?#Instances:instanceState=running;v=3)",
    gcp:
      "[GCP Compute Engine Dashboard](https://console.cloud.google.com/compute/instances)",
    azure:
      "[Azure Portal](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Compute%2FVirtualMachines)",
  };

  const loggingIntoArgoCDSection = `
### logging into argocd

When the \`cndi run\` command is finished, you should have a leader vm spinning up in the ${
    linkToDashboards[kind]
  }, by connecting to this node you should be able to get the new [ArgoCD](https://argo-cd.readthedocs.io) password.

\`\`\`bash
# print the argocd default admin password by running this on the controller node in EC2
microk8s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" --insecure-skip-tls-verify| base64 -d; echo
\`\`\`

Now to login to ArgoCD you can visit that controller's public IP address, and login with the username \`"admin"\` and the password you just printed.
`.trim();

  const readmeSectionsForKind = {
    aws: `
## aws

This cluster will be deployed on [Amazon Web Services](https://aws.com).
When your cluster is initialized the next step is to go to your domain registrar and create an CNAME record for your Airflow instance, and another for ArgoCD.
Both entries should point to the single load balancer that was created for your cluster.
`.trim(),
    gcp: `
## gcp

This cluster will be deployed on [Google Cloud Platform](https://cloud.google.com/gcp).
When your cluster is initialized the next step is to go to your domain registrar and create an A record for your Airflow instance, and another for ArgoCD.
Both entries should point to the single load balancer that was created for your cluster.
`.trim(),
    azure: `
## azure

This cluster will be deployed on [Microsoft Azure](https://azure.microsoft.com/en-ca/).
When your cluster is initialized the next step is to go to your domain registrar and create an A record for your Airflow instance, and another for ArgoCD.
Both entries should point to the single load balancer that was created for your cluster.
`.trim(),
  };

  return [
    `# ${project_name || "my-cndi-project"}`,
    coreReadmeSection,
    loggingIntoArgoCDSection,
    readmeSectionsForKind[kind],
  ].join("\n\n");
}
