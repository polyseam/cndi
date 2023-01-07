import { Template } from "./Template.ts";
import { getDefaultVmTypeForKind } from "../utils.ts";
import { CNDIConfig, NODE_ROLE, NodeKind } from "../types.ts";
import getReadmeForProject from "../doc/readme-for-project.ts";


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
            role: NODE_ROLE.leader,
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
  getReadmeString: getReadmeForProject,
});

export default basicTemplate;
