import { ccolors } from "deps";
import { getYAMLString } from "src/utils.ts";

const _productionClusterIssuerManifestLabel = ccolors.faded(
  "\nsrc/outputs/production-cluster-issuer.ts:",
);

const getProductionClusterIssuerManifest = (
  email: string,
): string => {
  const manifest = {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: {
      name: "cluster-issuer",
    },
    spec: {
      acme: {
        email,
        server: "https://acme-v02.api.letsencrypt.org/directory",
        privateKeySecretRef: {
          name: "cluster-issuer-private-key",
        },
        solvers: [
          {
            http01: {
              ingress: {
                ingressClassName: "public",
              },
            },
          },
        ],
      },
    },
  };

  return getYAMLString(manifest);
};

export default getProductionClusterIssuerManifest;
