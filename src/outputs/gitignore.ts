export default function getGitignore(): string {
  const gitignoreContents = `
# cndi
.env
.keys/
cndi/terraform/.terraform*
cndi/terraform/*.tfstate*
cndi/terraform/.terraform/
.DS_Store
microk8s-cloud-init-leader-hardcoded-values.yml.tftpl
`;
  return gitignoreContents.trim();
}
