import { YAML } from "deps";

const generalSteps = [
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
    name: "Setup Python",
    uses: "actions/setup-python@v4",
    with: {
      "python-version": "3.8",
    },
  },
  {
    name: "setup cndi",
    uses: "polyseam/setup-cndi@v2",
  },
  {
    name: "cndi ow",
    env: {
      ARM_REGION: "${{ vars.ARM_REGION }}",
      AWS_REGION: "${{ vars.AWS_REGION }}",
      GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
      GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
      GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
      SSH_PUBLIC_KEY: "${{ secrets.SSH_PUBLIC_KEY }}",
      TERRAFORM_STATE_PASSPHRASE: "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
      SEALED_SECRETS_PRIVATE_KEY: "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
      SEALED_SECRETS_PUBLIC_KEY: "${{ secrets.SEALED_SECRETS_PUBLIC_KEY }}",
      ARGOCD_ADMIN_PASSWORD: "${{ secrets.ARGOCD_ADMIN_PASSWORD }}",
      AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
      AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
      GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
      ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
      ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
      ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
      ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
      CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
    },
    run: "cndi ow",
  },
  {
    name: "Test Terraform with Checkov",
    id: "checkov-tf",
    uses: "bridgecrewio/checkov-action@master",
    with: {
      directory: "cndi/terraform",
      framework: "terraform_json",
      output_format: "github_failed_only",
      output_file_path: "checkov-tf.md",
    },
  },
  {
    name: "Test Kubernetes with Checkov",
    id: "checkov-k8s",
    uses: "bridgecrewio/checkov-action@master",
    with: {
      directory: "cndi/cluster_manifests",
      framework: "kubernetes",
      output_format: "github_failed_only",
      output_file_path: "checkov-k8s.md",
    },
  },
  {
    name: "Comment Checkov K8s",
    uses: "thollander/actions-comment-pull-request@v2",
    "continue-on-error": true,
    with: {
      filePath: "./checkov-k8s.md",
    },
  },
  {
    name: "Comment Checkov Terraform",
    uses: "thollander/actions-comment-pull-request@v2",
    "continue-on-error": true,
    with: {
      filePath: "./checkov-tf.md",
    },
  },
];

function getSteps(sourceRef?: string) {
  if (!sourceRef) {
    return generalSteps;
  }

  return [{
    name: "welcome",
    run: `echo "welcome to cndi@${sourceRef}!"`,
  }, {
    name: "checkout cndi repo",
    uses: "actions/checkout@v3",
    with: {
      repository: "polyseam/cndi",
      "fetch-depth": 0,
      ref: sourceRef,
    },
  }, {
    name: "setup deno",
    uses: "denoland/setup-deno@v1",
  }, {
    name: "build cndi",
    run: "deno task build-linux",
  }, {
    name: "persist cndi",
    run: "mkdir -p $HOME/.cndi/bin && mv ./dist/linux/in/* $HOME/.cndi/bin/",
  }, {
    name: "checkout repo",
    uses: "actions/checkout@v3",
    with: {
      "fetch-depth": 0,
    },
  }, {
    name: "Setup Python",
    uses: "actions/setup-python@v4",
    with: {
      "python-version": "3.8",
    },
  }, {
    name: "setup cndi",
    uses: "polyseam/setup-cndi@v2",
  }, {
    name: "cndi ow",
    env: {
      ARM_REGION: "${{ vars.ARM_REGION }}",
      AWS_REGION: "${{ vars.AWS_REGION }}",
      GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
      GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
      GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
      SSH_PUBLIC_KEY: "${{ secrets.SSH_PUBLIC_KEY }}",
      TERRAFORM_STATE_PASSPHRASE: "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
      SEALED_SECRETS_PRIVATE_KEY: "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
      SEALED_SECRETS_PUBLIC_KEY: "${{ secrets.SEALED_SECRETS_PUBLIC_KEY }}",
      ARGOCD_ADMIN_PASSWORD: "${{ secrets.ARGOCD_ADMIN_PASSWORD }}",
      AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
      AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
      GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
      ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
      ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
      ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
      ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
      CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
    },
    run: "cndi ow",
  }, {
    name: "Test Terraform with Checkov",
    id: "checkov-tf",
    uses: "bridgecrewio/checkov-action@master",
    with: {
      directory: "cndi/terraform",
      framework: "terraform_json",
      output_format: "github_failed_only",
      output_file_path: "checkov-tf.md",
    },
  }, {
    name: "Test Kubernetes with Checkov",
    id: "checkov-k8s",
    uses: "bridgecrewio/checkov-action@master",
    with: {
      directory: "cndi/cluster_manifests",
      framework: "kubernetes",
      output_format: "github_failed_only",
      output_file_path: "checkov-k8s.md",
    },
  }, {
    name: "Comment Checkov K8s",
    uses: "thollander/actions-comment-pull-request@v2",
    "continue-on-error": true,
    with: {
      filePath: "./checkov-k8s.md",
    },
  }, {
    name: "Comment Checkov Terraform",
    uses: "thollander/actions-comment-pull-request@v2",
    "continue-on-error": true,
    with: {
      filePath: "./checkov-tf.md",
    },
  }];
}

const getWorkflowYaml = (sourceRef?: string, disable = false) => {
  const on = disable ? {} : {
    pull_request: {
      types: ["opened", "synchronize", "reopened"],
    },
  };

  const cndiWorkflowObj = {
    name: "cndi",
    on,
    jobs: {
      "cndi-onpull": {
        // TODO: determine min scope
        permissions: "write-all",
        "runs-on": "ubuntu-20.04",
        env: {
          GIT_REPO: "${{ secrets.GIT_REPO }}",
          CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
        },
        steps: getSteps(sourceRef),
      },
    },
  };

  return YAML.stringify(cndiWorkflowObj);
};
export default getWorkflowYaml;
