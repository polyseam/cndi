export default function getArgoRootApplicationManifestYamlTftpl() {
  return `
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-application
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  destination:
    namespace: argocd
    server: https://kubernetes.default.svc
  source:
    path: cndi/cluster_manifests
    repoURL: \${git_repo}
    targetRevision: HEAD
    directory:
      recurse: true
  syncPolicy:
    automated:
      prune: true
      selfHeal: false
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    `.trim();
}
