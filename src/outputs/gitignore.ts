export default function getGitignore(): string {
  const gitignoreContents = `
# cndi
.env
.keys/
cndi/terraform/.terraform*
cndi/terraform/*.tfstate*
cndi/terraform/.terraform/
.DS_Store
`;
  return gitignoreContents.trim();
}
