export default function getArgoPrivateRepoSecretSSHYamlTftpl() {
  // this manifest uses b64 encoded `data` instead of stringData
  // because it must in order to contain a multiline value
  const clusterRepoSecretSSHYAML = `
apiVersion: v1
kind: Secret
metadata:
  name: private-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
data:
  url: '\${git_repo_encoded}'
  sshPrivateKey: '\${git_ssh_private_key}'`;

  return clusterRepoSecretSSHYAML.trim();
}
