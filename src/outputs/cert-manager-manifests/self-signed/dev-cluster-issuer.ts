import { ccolors } from "deps";
import { getPrettyJSONString } from "src/utils.ts";

const _devClusterIssuerManifestLabel = ccolors.faded(
  "\nsrc/outputs/self-signed/dev-cluster-issuer.ts:",
);

const getDevClusterIssuerManifest = (): string => {
  const manifest = {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: {
      name: "selfsigned-cluster-issuer",
    },
    spec: {
      selfSigned: {},
    },
  };
  return getPrettyJSONString(manifest);
};

export default getDevClusterIssuerManifest;
