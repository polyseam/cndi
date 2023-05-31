import { ccolors } from "deps";

import { getPrettyJSONString } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

const _ingressTcpServicesConfigMapManifestLabel = ccolors.faded(
  "\nsrc/outputs/custom-port-manifests/ingress-tcp-services-configmap.ts:",
);

interface NginxIngressContainerPorts {
  containerPort: number;
  name: string;
  hostPort: number;
  protocol?: string;
}

interface IngressDaemonSetManifest {
  apiVersion: "apps/v1";
  kind: "DaemonSet";
  metadata: {
    name: "nginx-ingress-microk8s-controller";
    namespace: "ingress";
    labels: {
      "microk8s-application": "nginx-ingress-microk8s";
    };
  };
  spec: {
    selector: {
      matchLabels: {
        name: "nginx-ingress-microk8s";
      };
    };
    template: {
      metadata: {
        labels: {
          name: "nginx-ingress-microk8s";
        };
      };
      spec: {
        containers: [
          {
            image: "registry.k8s.io/ingress-nginx/controller:v1.5.1";
            name: "nginx-ingress-microk8s";
            env: [
              {
                name: "POD_NAME";
                valueFrom: {
                  fieldRef: {
                    fieldPath: "metadata.name";
                  };
                };
              },
              {
                name: "POD_NAMESPACE";
                valueFrom: {
                  fieldRef: {
                    fieldPath: "metadata.namespace";
                  };
                };
              },
            ];
            ports: Array<NginxIngressContainerPorts>;
            args: [
              "/nginx-ingress-controller",
              "--tcp-services-configmap=$(POD_NAMESPACE)/nginx-ingress-tcp-microk8s-conf",
              "--ingress-class=public",
            ];
          },
        ];
      };
    };
  };
}

const getIngressDaemonSetManifest = (
  user_ports: Array<CNDIPort>,
): string => {
  const default_ports = [
    {
      "name": "http",
      "containerPort": 80,
      "hostPort": 80,
    },
    {
      "name": "https",
      "containerPort": 443,
      "hostPort": 443,
    },
  ];

  const ports = [
    ...default_ports,
    ...user_ports.map(
      (port) => ({
        name: port.name,
        containerPort: port.number,
        hostPort: port.number,
        protocol: "TCP",
      }),
    ),
  ];

  const manifest: IngressDaemonSetManifest = {
    "apiVersion": "apps/v1",
    "kind": "DaemonSet",
    "metadata": {
      "name": "nginx-ingress-microk8s-controller",
      "namespace": "ingress",
      "labels": {
        "microk8s-application": "nginx-ingress-microk8s",
      },
    },
    "spec": {
      "selector": {
        "matchLabels": {
          "name": "nginx-ingress-microk8s",
        },
      },
      "template": {
        "metadata": {
          "labels": {
            "name": "nginx-ingress-microk8s",
          },
        },
        "spec": {
          "containers": [
            {
              "image": "registry.k8s.io/ingress-nginx/controller:v1.5.1",
              "name": "nginx-ingress-microk8s",
              "env": [
                {
                  "name": "POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "fieldPath": "metadata.name",
                    },
                  },
                },
                {
                  "name": "POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "fieldPath": "metadata.namespace",
                    },
                  },
                },
              ],
              ports,

              "args": [
                "/nginx-ingress-controller",
                "--tcp-services-configmap=$(POD_NAMESPACE)/nginx-ingress-tcp-microk8s-conf",
                "--ingress-class=public",
              ],
            },
          ],
        },
      },
    },
  };

  return getPrettyJSONString(manifest);
};

export default getIngressDaemonSetManifest;
