export function getFunctionsEnvSecretManifest() {
  const manifest = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "fns-env-secret",
      namespace: "fns",
    },
    stringData: {},
  };
  return manifest;
}
