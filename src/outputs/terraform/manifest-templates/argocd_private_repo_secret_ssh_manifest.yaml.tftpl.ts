import { YAML } from "deps";

export default function getArgoPrivateRepoSecretSSHYamlTftpl() {
  const clusterRepoSecretSSH = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "private-repo",
      namespace: "argocd",
      labels: {
        "argocd.argoproj.io/secret-type": "repository",
      },
    },
    stringData: {
      type: "git",
      sshPrivateKey: "\${git_ssh_private_key}",
      url: "\${git_repo}",
    },
  };
  return YAML.stringify(clusterRepoSecretSSH).trim();
}
