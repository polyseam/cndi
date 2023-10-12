export default function getGitignore(): string {
  const gitignoreContents = `
# cndi
.env
.keys/
ssh_access_key.pem
cndi/terraform/.terraform*
cndi/terraform/*.tfstate*
cndi/terraform/.terraform/
.DS_Store
cndi/terraform/microk8s-cloud-init-leader-hardcoded-values.yml.tftpl
cndi/terraform/leader_ip_address.txt
`;
  return gitignoreContents.trim();
}
