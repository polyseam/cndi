import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { getDependsOnForClusterWithCNDIConfig } from "src/outputs/terraform/shared/utils.ts";

export default function (cndi_config: CNDIConfig) {
  const depends_on = getDependsOnForClusterWithCNDIConfig(cndi_config);
  const resource = {
    kubernetes_secret: {
      cndi_kubernetes_secret_sealed_secrets_key: {
        metadata: {
          labels: {
            "sealedsecrets.bitnami.com/sealed-secrets-key": "active",
          },
          name: "sealed-secrets-key",
          namespace: "kube-system",
        },
        type: "kubernetes.io/tls",
        data: {
          "tls.crt": "${var.SEALED_SECRETS_PUBLIC_KEY}",
          "tls.key": "${var.SEALED_SECRETS_PRIVATE_KEY}",
        },
        depends_on,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
