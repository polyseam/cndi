const coreReadmeBlock = `
# my-cndi-project

This project was created with [CNDI](https://github.com/polyseam/cndi), and this README is to help show you the ropes.

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
`;

export default coreReadmeBlock;
