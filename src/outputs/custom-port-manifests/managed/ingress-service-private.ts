import { ccolors } from "deps";

import { CNDIPort, ManagedNodeKind } from "src/types.ts";
import { getYAMLString } from "src/utils.ts";

const ingressTcpServicesConfigMapManifestLabel = ccolors.faded(
  "\nsrc/outputs/custom-port-manifests/managed/ingress-service.ts:",
);

type ManagedAnnotations = {
  [key in ManagedNodeKind]: Record<string, string>;
};

// TODO: @IamTamika - please verify/add annotations for each managed provider
const MANAGED_ANNOTATIONS: ManagedAnnotations = {
  eks: {
    "service.beta.kubernetes.io/aws-load-balancer-scheme": "internal",
  },
  gke: {
    "networking.gke.io/load-balancer-type": "Internal",
  },
  aks: {
    "service.beta.kubernetes.io/azure-load-balancer-internal": "true",
    "service.beta.kubernetes.io/azure-load-balancer-health-probe-request-path":
      "/healthz",
  },
};

interface IngressService {
  apiVersion: string;
  kind: "Service";
  metadata: {
    "name": string;
    "namespace": "ingress-private";
    "annotations": Record<string, string>;
  };
  spec: {
    type: "LoadBalancer";
    ports?: Array<ServicePort>;
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
  kind: ManagedNodeKind,
): string => {
  const ports: Array<ServicePort> = [...default_ports];

  user_ports.forEach((port) => {
    if (!port?.private) {
      // port is not private, don't add it to the private service
      return;
    }
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
      "annotations": MANAGED_ANNOTATIONS[kind],
    },
    spec: {
      type: "LoadBalancer",
    },
  };

  if (ports.length > 0) {
    manifest.spec.ports = ports;
  }

  return getYAMLString(manifest);
};

export default getIngressServiceManifest;
