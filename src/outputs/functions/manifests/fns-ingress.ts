import { getYAMLString } from "src/utils.ts";

export function getFunctionsIngressManifest(hostname: string): string {
  const manifest = {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name: "fns-ingress",
      namespace: "fns",
      annotations: {
        "cert-manager.io/cluster-issuer": "cluster-issuer",
        "kubernetes.io/tls-acme": "true",
        "external-dns.alpha.kubernetes.io/hostname": hostname,
      },
    },
    spec: {
      ingressClassName: "public",
      tls: [
        {
          hosts: [hostname],
          secretName: "cluster-issuer-private-key",
        },
      ],
      rules: [
        {
          host: hostname,
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: "fns-svc",
                    port: {
                      number: 443,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
  return getYAMLString(manifest);
}
