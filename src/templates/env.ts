const getDotEnv = (): string => {
  return `# AWS Credentials
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Git Credentials
GIT_USERNAME=
GIT_PASSWORD=
GIT_REPO=
TERRAFORM_STATE_PASSPHRASE=${crypto.randomUUID()}
`;
};

export default getDotEnv;
