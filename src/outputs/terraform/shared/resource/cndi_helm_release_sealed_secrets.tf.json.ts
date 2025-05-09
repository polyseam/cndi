import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { SEALED_SECRETS_CHART_VERSION } from "versions";

export default function (_cndi_config: CNDIConfig) {
  const resource = {
    helm_release: {
      cndi_helm_release_sealed_secrets: {
        atomic: true,
        chart: "sealed-secrets",
        depends_on: [
          "kubernetes_secret.cndi_kubernetes_secret_sealed_secrets_key",
        ],
        name: "sealed-secrets",
        namespace: "kube-system",
        repository: "https://bitnami-labs.github.io/sealed-secrets",
        timeout: 300,
        version: SEALED_SECRETS_CHART_VERSION,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
