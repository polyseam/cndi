import getPublicIngressManifest from "src/outputs/public-ingress-manifest.ts";

export function getFunctionsIngressManifest(hostname: string): string {
  return getPublicIngressManifest("fns-ingress", {
    hostname,
    namespace: "fns",
    pathSpecs: [
      {
        serviceName: "fns-svc",
        servicePort: { number: 443 },
      },
    ],
  });
}
