import { stringify } from "deps";

const cndiWorkflowObj = {
  name: "cndi",
  on: {
    push: {
      branches: ["main", "releases/**"],
    },
  },
  jobs: {
    "cndi-run": {
      "runs-on": "ubuntu-20.04",
      steps: [
        {
          name: "welcome",
          run: 'echo "welcome to cndi!"',
        },
        {
          name: "checkout repo",
          uses: "actions/checkout@v3",
          with: {
            "fetch-depth": 0,
          },
        },
        {
          name: "setup cndi",
          uses: "polyseam/setup-cndi@v2.0.0",
        },
        {
          name: "cndi install",
          run: "cndi install",
        },
        {
          name: "cndi run",
          env: {
            GIT_REPO: "https://github.com/${{ github.repository }}",
            GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
            GIT_PASSWORD: "${{ secrets.GIT_PASSWORD }}",
            TERRAFORM_STATE_PASSPHRASE:
              "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
            SEALED_SECRETS_PRIVATE_KEY:
              "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
            SEALED_SECRETS_PUBLIC_KEY:
              "${{ secrets.SEALED_SECRETS_PUBLIC_KEY }}",
            ARGO_UI_ADMIN_PASSWORD: "${{ secrets.ARGO_UI_ADMIN_PASSWORD }}",
            AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
            AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
            AWS_REGION: "${{ secrets.AWS_REGION }}",
            GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
            ARM_REGION: "${{ secrets.ARM_REGION }}",
            ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
            ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
            ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
            ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
          },
          run: "cndi run",
        },
      ],
    },
  },
};

const getWorkflowYaml = () => stringify(cndiWorkflowObj);
export default getWorkflowYaml;
