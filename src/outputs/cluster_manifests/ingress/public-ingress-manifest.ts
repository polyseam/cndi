import { getYAMLString } from "src/utils.ts";

type PathType = "Prefix" | "ImplementationSpecific" | "Exact";

interface PathSpec {
  path?: string;
  pathType?: PathType;
  serviceName: string;
  servicePort: {
    number?: number;
    name?: string;
  };
}

interface PublicIngressOptions {
  hostname: string;
  pathSpecs: PathSpec[];
  namespace: string;
  annotations?: Record<string, string>;
}

interface Path {
  path: string;
  pathType: PathType;
  backend: {
    service: {
      name: string;
      port: {
        number?: number;
        name?: string;
      };
    };
  };
}

function getPaths(pathSpecs: PathSpec[]): Path[] {
  return pathSpecs.map(({ servicePort, serviceName, pathType, path }): Path => {
    return {
      path: path || "/",
      pathType: pathType || "Prefix",
      backend: {
        service: {
          name: serviceName,
          port: servicePort,
        },
      },
    };
  });
}

export default function getStandardPublicIngress(
  name: string,
  options: PublicIngressOptions,
): string {
  const { hostname, pathSpecs, namespace } = options;
  const annotations = {
    "cert-manager.io/cluster-issuer": "cluster-issuer",
    "kubernetes.io/tls-acme": "true",
    "external-dns.alpha.kubernetes.io/hostname": hostname,
    ...options.annotations,
  };

  const paths = getPaths(pathSpecs);

  const manifest = {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name,
      namespace,
      annotations,
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
            paths,
          },
        },
      ],
    },
  };
  return getYAMLString(manifest);
}
