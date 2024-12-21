import getPublicIngressManifest from "src/outputs/public-ingress-manifest.ts";

export function getGrafanaIngressManifest(hostname: string): string {
  return getPublicIngressManifest("argocd-ingress", {
    hostname,
    namespace: "observability",
    annotations: {
      "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
    },
    pathSpecs: [
      {
        serviceName: "kube-prometheus-stack-grafana",
        servicePort: { number: 80 },
      },
    ],
  });
}
