import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { SEALED_SECRETS_CHART_VERSION } from "versions";
import { getDependsOnForClusterWithCNDIConfig } from "../utils.ts";

export default function (cndi_config: CNDIConfig) {
  const depends_on = getDependsOnForClusterWithCNDIConfig(cndi_config);

  depends_on.push(
    "kubernetes_secret.cndi_kubernetes_secret_sealed_secrets_key",
  );

  const resource = {
    helm_release: {
      cndi_helm_release_sealed_secrets: {
        atomic: true,
        chart: "sealed-secrets",
        name: "sealed-secrets",
        namespace: "kube-system",
        repository: "https://bitnami-labs.github.io/sealed-secrets",
        depends_on,
        timeout: 300,
        version: SEALED_SECRETS_CHART_VERSION,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
