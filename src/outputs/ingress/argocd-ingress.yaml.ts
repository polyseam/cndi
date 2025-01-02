//
import getPublicIngressManifest from "src/outputs/public-ingress-manifest.ts";

export function getArgoIngressManifest(hostname: string): string {
  return getPublicIngressManifest("argocd-ingress", {
    hostname,
    namespace: "argocd",
    annotations: {
      "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
    },
    pathSpecs: [
      {
        serviceName: "argocd-server",
        servicePort: { number: 443 },
      },
    ],
  });
}
