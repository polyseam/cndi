import { YAML } from "../../../deps.ts";
export default function getArgoRootApplicationManifestYamlTftpl() {
  const rootApplication = {
    apiVersion: "argoproj.io/v1alpha1",
    kind: "Application",
    metadata: {
      name: "root-application", // TODO: name this with "cndi-" prefix ?
      namespace: "argocd",
      finalizers: [
        "resources-finalizer.argocd.argoproj.io", // TODO: wut
      ],
    },
    spec: {
      project: "default",
      destination: {
        namespace: "argocd",
        server: "https://kubernetes.default.svc",
      },
      source: {
        path: "cndi/cluster_manifests",
        repoURL: "\${git_repo}",
        targetRevision: "HEAD",
        directory: {
          recurse: true,
        },
      },
      syncPolicy: {
        automated: {
          prune: true,
          selfHeal: true,
        },
        syncOptions: [
          "CreateNamespace=true",
        ],
      },
    },
  };
  return YAML.stringify(rootApplication).trim();
}
