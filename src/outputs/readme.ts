import { NodeKind } from "src/types.ts";

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
  nodeKind,
}: { project_name: string; nodeKind: NodeKind }): string {
  const linkToDashboards = {
    aws:
      "[AWS EC2 Dashboard](https://console.aws.amazon.com/ec2/home?#Instances:instanceState=running;v=3)",
    gcp:
      "[GCP Compute Engine Dashboard](https://console.cloud.google.com/compute/instances)",
    azure:
      "[Azure Portal](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Compute%2FVirtualMachines)",
  };

  const linkToLoadBalancers = {
    aws:
      "[AWS Load Balancers Page](https://console.aws.amazon.com/ec2/v2/home?#LoadBalancers)",
    gcp:
      "[GCP Load Balancers Page](https://console.cloud.google.com/net-services/loadbalancing)",
    azure:
      "[Azure Load Balancers Page](https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FloadBalancers)",
  };

  const loggingIntoArgoCDSection = `
### logging into argocd

Once your cluster is deployed, you can log into ArgoCD to see the status of your cluster. This can be done by logging into the ArgoCD UI with the username "admin" and the password that has been set for you in the [.env](/.env) file as \`ARGOCD_ADMIN_PASSWORD\` at the domain name you configured for Argo's ingress above.
`.trim();

  const ec2ReadmeSection = `
## aws

This cluster will be deployed on [Amazon Web Services](https://aws.com).
When your cluster is initialized the next step is to go to your domain registrar and create an CNAME record for ArgoCD.
Both entries should point to the single load balancer that was created for your cluster found on the ${linkToLoadBalancers.aws}.

You can visit the ${linkToDashboards.aws} to see the status of the nodes that make up your cluster.
`.trim();

  const readmeSectionsForDeploymentTarget = {
    ec2: ec2ReadmeSection,
    aws: ec2ReadmeSection,
    eks: ec2ReadmeSection, // TODO: README.md for EKS should be different than that of EC2
    gcp: `
## gcp

This cluster will be deployed on [Google Cloud Platform](https://cloud.google.com/gcp).
When your cluster is initialized the next step is to go to your domain registrar and create an A record for ArgoCD.
Both entries should point to the single load balancer that was created for your cluster found on the ${linkToLoadBalancers.gcp}.

You can visit the ${linkToDashboards.gcp} to see the status of the nodes that make up your cluster.
`.trim(),
    azure: `
## azure

This cluster will be deployed on [Microsoft Azure](https://azure.microsoft.com/en-ca/).
When your cluster is initialized the next step is to go to your domain registrar and create an A record for ArgoCD.
Both entries should point to the single load balancer that was created for your cluster found on the ${linkToLoadBalancers.azure}.

You can visit the ${linkToDashboards.azure} to see the status of the nodes that make up your cluster.
`.trim(),
    dev: `TODO: add dev readme section`,
  };

  const readmeContent = [
    `# ${project_name || "my-cndi-project"}`,
    coreReadmeSection,
    readmeSectionsForDeploymentTarget[nodeKind],
    loggingIntoArgoCDSection,
  ].join("\n\n");

  return readmeContent;
}
