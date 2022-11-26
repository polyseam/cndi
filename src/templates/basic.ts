import { getPrettyJSONString, getDefaultVmTypeForKind } from "../utils.ts";


export default function getBasicTemplate(kind:string): string {
  const [vmTypeKey, vmTypeValue] = getDefaultVmTypeForKind(kind);

  return getPrettyJSONString({
    nodes: {
      entries: [
        {
          name: "x-node",
          kind,
          role: "leader",
          [vmTypeKey]: vmTypeValue,
          volume_size: 128, // GiB
        },
        {
          name: "y-node",
          kind,
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
        {
          name: "z-node",
          kind,
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
      ],
    },
    cluster: {
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
  });
}
