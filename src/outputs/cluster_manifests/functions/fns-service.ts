import { getYAMLString } from "src/utils.ts";

export function getFunctionsServiceManifest(): string {
  const manifest = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      namespace: "fns",
      name: "fns-svc",
    },
    spec: {
      selector: {
        app: "fns",
      },
      ports: [
        {
          name: "443",
          port: 443,
          targetPort: 9000,
        },
      ],
    },
  };
  return getYAMLString(manifest);
}
