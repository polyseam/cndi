import { ccolors } from "deps";

import { getPrettyJSONString } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

const ingressTcpServicesConfigMapManifestLabel = ccolors.faded(
  "\nsrc/outputs/custom-port-manifests/microk8s/ingress-tcp-services-configmap.ts:",
);

interface IngressTCPServicesConfigMap {
  apiVersion: string;
  kind: "ConfigMap";
  metadata: {
    name: "nginx-ingress-tcp-microk8s-conf";
    namespace: "ingress";
  };
  data: {
    [key: string]: string;
  };
}

const getIngressTcpServicesConfigMapManifest = (
  ports: Array<CNDIPort>,
): string => {
  const manifest: IngressTCPServicesConfigMap = {
    "apiVersion": "v1",
    "kind": "ConfigMap",
    "metadata": {
      "name": "nginx-ingress-tcp-microk8s-conf",
      "namespace": "ingress",
    },
    "data": {},
  };

  ports.forEach((port) => {
    if (!port?.number) {
      console.error(
        ingressTcpServicesConfigMapManifestLabel,
        'custom port specs need "number" property',
      );
    }
    if (!port?.namespace) {
      console.error(
        ingressTcpServicesConfigMapManifestLabel,
        'custom port specs need "namespace" property',
      );
    }
    if (!port?.service) {
      console.error(
        ingressTcpServicesConfigMapManifestLabel,
        'custom port specs need "service" property',
      );
    }
    manifest.data[`${port.number}`] =
      `${port.namespace}/${port.service}:${port.number}`;
  });

  return getPrettyJSONString(manifest);
};

export default getIngressTcpServicesConfigMapManifest;
