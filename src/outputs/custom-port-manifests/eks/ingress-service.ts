import { ccolors } from "deps";

import { getPrettyJSONString } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

const ingressTcpServicesConfigMapManifestLabel = ccolors.faded(
  "\nsrc/outputs/custom-port-manifests/eks/ingress-service.ts:",
);

interface IngressService {
  apiVersion: string;
  kind: "Service";
  metadata: {
    "name": "ingress-nginx-controller";
    "namespace": "ingress";
  };
  spec: {
    type: "LoadBalancer";
    ports: Array<ServicePort>;
  };
}

const default_ports: Array<ServicePort> = [
  {
    "name": "http",
    "port": 80,
    "targetPort": 80,
    "protocol": "TCP",
  },
  {
    "name": "https",
    "port": 443,
    "targetPort": 443,
    "protocol": "TCP",
  },
];

type ServicePort = {
  name: string;
  port: number;
  targetPort: number;
  protocol: "TCP";
};

const getIngressServiceManifest = (
  user_ports: Array<CNDIPort>,
): string => {
  const ports: Array<ServicePort> = [...default_ports];

  user_ports.forEach((port) => {
    const { number, name, disable } = port;

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

    if (disable) {
      const portToRemove = ports.findIndex((item) => item.port === port.number);
      if (portToRemove > -1) {
        ports.splice(portToRemove, 1);
      }
    } else {
      ports.push({
        port: number,
        targetPort: number,
        protocol: "TCP",
        name: name || `port-${number}`,
      });
    }
  });

  const manifest: IngressService = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      "name": "ingress-nginx-controller",
      "namespace": "ingress",
    },
    spec: {
      type: "LoadBalancer",
      ports,
    },
  };

  return getPrettyJSONString(manifest);
};

export default getIngressServiceManifest;
