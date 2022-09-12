const getRepoConfigManifest = (
  repoUrl: string,
  gitUsername: string,
  gitPassword: string
): string => {
  return `apiVersion: v1
kind: Secret
metadata:
  name: private-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: ${repoUrl}
  username: ${gitUsername}
  password: ${gitPassword}`;
};

export default getRepoConfigManifest;
