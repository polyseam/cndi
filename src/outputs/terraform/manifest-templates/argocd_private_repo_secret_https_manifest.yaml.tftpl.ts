import { YAML } from "../../../deps.ts";

export default function getArgoPrivateRepoSecretHTTPSYamlTftpl() {
  const clusterRepoSecretHTTPS = {
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
      password: "\${git_token}",
      username: "\${git_username}",
      url: "\${git_repo}",
    },
  };
  return YAML.stringify(clusterRepoSecretHTTPS).trim();
}
