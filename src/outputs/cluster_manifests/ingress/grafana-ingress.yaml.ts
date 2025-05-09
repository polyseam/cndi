import getPublicIngressManifest from "src/outputs/cluster_manifests/ingress/public-ingress-manifest.ts";

export function getGrafanaIngressManifest(hostname: string): string {
  return getPublicIngressManifest("grafana-ingress", {
    hostname,
    namespace: "observability",
    pathSpecs: [
      {
        serviceName: "kube-prometheus-stack-grafana",
        servicePort: { number: 80 },
      },
    ],
  });
}
