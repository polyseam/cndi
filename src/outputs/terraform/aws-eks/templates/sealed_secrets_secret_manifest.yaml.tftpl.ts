export default function getSealedSecretsKeyYamlTftpl() {
  return `
apiVersion: v1
kind: Secret
metadata:
  name: sealed-secrets-key
  namespace: kube-system
  type: kubernetes.io/tls
  labels:
    sealedsecrets.bitnami.com/sealed-secrets-key: active
data:
  tls.crt: \${sealed_secret_cert_pem}
  tls.key: \${sealed_secret_private_key_pem}
  `.trim();
}
