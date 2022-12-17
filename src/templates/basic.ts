import { Template } from "./Template.ts";
import { getDefaultVmTypeForKind } from "../utils.ts";
import { CNDIConfig, NodeKind, NodeRole } from "../types.ts";

const readmeBlock = `
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

function getBasicTemplate(kind: NodeKind): CNDIConfig {
  const [vmTypeKey, vmTypeValue] = getDefaultVmTypeForKind(kind);
  const volume_size = 128;
  return {
    infrastructure: {
      cndi: {
        nodes: [
          {
            name: "x-node",
            kind,
            role: NodeRole.leader,
            [vmTypeKey]: vmTypeValue,
            volume_size,
          },
          {
            name: "y-node",
            kind,
            [vmTypeKey]: vmTypeValue,
            volume_size,
          },
          {
            name: "z-node",
            kind,
            [vmTypeKey]: vmTypeValue,
            volume_size,
          },
        ],
      },
    },
    cluster_manifests: {
      "argo-ingress": {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: "argocd-server-ingress",
          namespace: "argocd",
          annotations: {
            "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
            "nginx.ingress.kubernetes.io/ssl-passthrough": "true",
          },
        },
        spec: {
          rules: [
            {
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "argocd-server",
                        port: {
                          name: "https",
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
    applications: {},
  };
}

const basicTemplate = new Template("basic", {
  getConfiguration: async (_: boolean) => {
    return await {};
  },
  getEnv: async (_: boolean) => {
    return await {};
  },
  getTemplate: getBasicTemplate,
  readmeBlock,
});

export default basicTemplate;
