export default function getGitignore(): string {
  const gitignoreContents = `
# cndi
.env
.keys/
cndi/terraform/.terraform*
cndi/terraform/*.tfstate*
cndi/terraform/.terraform/
cndi_rsa
# v2
cndi/terraform/stacks/cndi_stack/.terraform*
cndi/terraform/stacks/cndi_stack/*.tfstate*
cndi/terraform/stacks/cndi_stack/.terraform/
cndi/terraform/stacks/cndi_stack/terraform.tfstate
.DS_Store
cndi_responses.yaml
cndi/terraform/*.sensitive.*
*-kind-cluster-config
`;
  return gitignoreContents.trim();
}
