import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const resource = {
    kubernetes_secret: {
      cndi_kubernetes_secret_argocd_private_repo: {
        metadata: {
          labels: {
            "argocd.argoproj.io/secret-type": "repository",
          },
          name: "private-repo",
          namespace: "argocd",
        },
        data: {
          type: "git",
          password: "${var.GIT_TOKEN}",
          url: "${var.GIT_REPO}",
          username: "${var.GIT_USERNAME}",
        },
        depends_on: [
          "helm_release.cndi_helm_release_argocd",
        ],
      },
    },
  };
  return getPrettyJSONString({ resource });
}
