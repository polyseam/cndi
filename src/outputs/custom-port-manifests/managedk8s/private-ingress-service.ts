import { ccolors } from "deps";

import { CNDIPort } from "src/types.ts";
import { getYAMLString } from "src/utils.ts";

const ingressTcpServicesConfigMapManifestLabel = ccolors.faded(
  "\nsrc/outputs/custom-port-manifests/managedk8s/private-ingress-service.ts:",
);

interface IngressService {
  apiVersion: string;
  kind: "Service";
  metadata: {
    "name": "ingress-nginx-private-controller";
    "namespace": "ingress-private";
    "annotations": {
      "service.beta.kubernetes.io/azure-load-balancer-internal": "true";
    };
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

const getPrivateIngressServiceManifest = (
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

    if (!disable && !port?.namespace && !port?.service) {
      return;
    }

    if (disable) {
      const portToRemove = ports.findIndex((item) =>
        (item.port === port.number) || (item.name === port.name)
      );
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
      "name": "ingress-nginx-private-controller",
      "namespace": "ingress-private",
      "annotations": {
        "service.beta.kubernetes.io/azure-load-balancer-internal": "true",
      },
    },
    spec: {
      type: "LoadBalancer",
      ports,
    },
  };

  return getYAMLString(manifest);
};

export default getPrivateIngressServiceManifest;
