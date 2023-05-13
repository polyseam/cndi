export default function getArgoPrivateRepoSecretYamlTftpl() {
  return `
apiVersion: v1
kind: Secret
metadata:
  name: private-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: \${git_repo}
  password: \${git_password}
  username: \${git_username}
    `.trim();
}
