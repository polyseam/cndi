import coreReadmeSection from "./core.ts";
import { GetReadmeStringArgs } from "../templates/Template.ts";

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
