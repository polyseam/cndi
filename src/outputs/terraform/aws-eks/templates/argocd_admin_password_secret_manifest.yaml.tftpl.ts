export default function getArgoAdminPasswordSecretManifestYamlTftpl() {
  return `
apiVersion: v1
kind: Secret
metadata:
  name: argocd-secret
  namespace: argocd
stringData:
  admin.password: \${argocd_admin_password}
  admin.passwordMtime: \${admin_password_time}
`.trim();
}
