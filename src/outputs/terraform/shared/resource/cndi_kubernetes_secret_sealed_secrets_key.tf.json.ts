import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
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
        depends_on: [],
      },
    },
  };
  return getPrettyJSONString({ resource });
}
