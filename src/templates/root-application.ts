const getRootApplicationManifest = (repoUrl: string): string => {
  return `apiVersion: argoproj.io/v1alpha1
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
    path: cndi/cluster
    repoURL: ${repoUrl}
    targetRevision: HEAD
    directory:
      recurse: true
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 10
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 4m`;
};

export default getRootApplicationManifest;
