import { getYAMLString } from "src/utils.ts";

export function getFunctionsDeploymentManifest(): string {
  const OW_TIMESTAMP = new Date().toISOString();
  const REPO_URL = Deno.env.get("GIT_REPO");
  const repoPath = REPO_URL?.split("github.com")[1];

  if (!repoPath) {
    console.error(`'GIT_REPO' must be a GitHub URL when using CNDI Functions`);
  }

  // eg ghcr.io/username/repo:main
  const image = `ghcr.io${repoPath}-functions:main`;

  const manifest = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: "fns",
      namespace: "fns",
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: "fns",
        },
      },
      template: {
        metadata: {
          labels: {
            app: "fns",
          },
        },
        spec: {
          terminationGracePeriodSeconds: 30,
          containers: [
            {
              name: "fns",
              image,
              imagePullPolicy: "Always",
              ports: [
                {
                  "containerPort": 9000,
                  "hostPort": 443,
                  "protocol": "TCP",
                },
              ],
              // this guarantees that the function will be pulled when it changes
              env: [
                {
                  name: "OW_TIMESTAMP",
                  value: OW_TIMESTAMP,
                },
              ],
              envFrom: [
                {
                  secretRef: {
                    name: "fns-env-secret",
                  },
                },
              ],
            },
          ],
          restartPolicy: "Always",
          imagePullSecrets: [
            {
              name: "fns-pull-secret",
            },
          ],
        },
      },
    },
  };
  return getYAMLString(manifest);
}
