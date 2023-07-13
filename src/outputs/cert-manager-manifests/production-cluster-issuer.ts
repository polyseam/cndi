import { ccolors } from "deps";
import { getPrettyJSONString } from "src/utils.ts";

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
      name: "lets-encrypt",
    },
    spec: {
      acme: {
        email,
        server: "https://acme-v02.api.letsencrypt.org/directory",
        privateKeySecretRef: {
          name: "lets-encrypt-private-key",
        },
        solvers: [
          {
            http01: {
              ingress: {
                class: "public",
              },
            },
          },
        ],
      },
    },
  };

  return getPrettyJSONString(manifest);
};

export default getProductionClusterIssuerManifest;
