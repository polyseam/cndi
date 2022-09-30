const getDotEnv = (): string => {
  return `# AWS Credentials
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_SDK_LOAD_CONFIG=

# Git Credentials
GIT_USERNAME=
GIT_PASSWORD=
GIT_REPO=`;
};

export default getDotEnv;
