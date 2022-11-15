import { CNDIContext } from "../types.ts";

const enum Template {
  "airflow-tls" = "airflow-tls",
  "basic" = "basic",
}

type TemplateBlock = {
  [key in Template]: string;
};

const basicBlock = `
### logging into argocd

When the \`cndi run\` command is finished, you should have a controller vm spinning up in the [AWS EC2 Dashboard](https://console.aws.amazon.com/ec2/home?#Instances:instanceState=running;v=3), by connecting to this node you should be able to get the new [ArgoCD](https://argo-cd.readthedocs.io) password.

\`\`\`bash
# print the argocd default admin password by running this on the controller node in EC2
microk8s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" --insecure-skip-tls-verify| base64 -d; echo
\`\`\`

Now to login to ArgoCD you can visit that controller's public IP address, and login with the username \`"admin"\` and the password you just printed.

### updating your cluster

Now that you have a cluster, you can update it by:

1. modifying your [cndi-config.jsonc](/cndi-config.jsonc) file
2. running \`cndi ow\` 
3. pushing all files to the \`"main"\` branch again

If you've modified your nodes, the infrastructure should be updated with Terraform. If you've modified your Kubernetes manifests, the changes to the manifests will be applied to the cluster.
`.trim();

const templateBlocks: TemplateBlock = {
  "airflow-tls": `${basicBlock}
  
### dns setup

To set up DNS and TLS you just need to login to your registrar and set 2 A records that point from your 2 application subdomains to the public IP address of your controller node.
  `,
  basic: basicBlock,
};

const getREADME = (context: CNDIContext): string => {
  const { template } = context;

  const templateBlock = templateBlocks[template as Template];

  return `
# my-cndi-project

This project was created with [CNDI](https://github.com/polyseam/cndi-next), and this README is to help show you the ropes.

## files and directories

### cndi/cluster

All files in the [cndi/cluster](/cndi/cluster) folder are Kubernetes manifests. These are the files that will be applied to your Kubernetes cluster when it is deployed and ready using ArgoCD.

### cndi/terraform

All files in the [cndi/terraform](/cndi/terraform) folder are [Terraform](https://terraform.io) Resource files. These are the files that will be used to provision your cloud infrastructure, as well as configure the virtual machines to join your cluster as they come online.

### .github

The files within the [.github](/.github) folder are the workflows that run within [GitHub Actions](https://docs.github.com/en/actions) to call the \`cndi run\` command when you push to the \`"main"\` branch.

### .env

The [.env](/.env) file is where you can set environment variables that will be used by the \`cndi\` commands. These variables are used to configure the Terraform resources and Kubernetes manifests. This file can contain secrets, because it will not be committed to your repository. It comes pre-populated with a few generated values, but there are a couple you must set yourself too.

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

${template ? `## ${template} template instructions` : ""}

${templateBlock || ""}
`.trim();
};

export default getREADME;
