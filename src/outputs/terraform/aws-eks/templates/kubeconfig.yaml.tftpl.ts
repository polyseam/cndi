export default function getKubeConfigYamlTftpl() {
  return `
apiVersion: v1
clusters:
- cluster:
    server: https://\${cluster_endpoint}
    certificate-authority-data: \${cluster_ca_certificate}
  name: \${cluster_user_arn}
contexts:
- context:
    cluster: \${cluster_user_arn}
    user: \${cluster_user_arn}
  name: \${cluster_user_arn}
current-context: \${cluster_user_arn}
kind: Config
preferences: {}
users:
- name: \${cluster_user_arn}
  user:
    token: \${token}
  `.trim();
}
