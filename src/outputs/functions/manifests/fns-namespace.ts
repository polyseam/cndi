import { getYAMLString } from "src/utils.ts";

export function getFunctionsNamespaceManifest(): string {
  const manifest = {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      name: "fns",
    },
  };
  return getYAMLString(manifest);
}
