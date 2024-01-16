import { YAML } from "deps";
import { deno_version } from "../../deno.json" assert { type: "json" };

const cndiWorkflowObj = {
  name: "cndi",
  on: {
    push: {
      branches: ["main", "releases/**"],
    },
  },
  jobs: {
    "cndi-run": {
      // TODO: determine min scope
      permissions: "write-all",
      "runs-on": "ubuntu-20.04",
      env: {
        GIT_REPO: "${{ secrets.GIT_REPO }}",
        CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
      },
      steps: [
        {
          name: "welcome",
          run: 'echo "welcome to cndi!"',
        },
        {
          id: "lock-check",
          uses: "github/lock@v2.0.1",
          with: {
            mode: "check",
            environment: "global",
          },
        },
        {
          name: "fail if locked",
          if: "${{ steps.lock-check.outputs.locked != 'false' }}",
          run: "echo \"cndi cannot 'run': deployment in progress\" && exit 1",
        },
        {
          id: "lock-acquire",
          uses: "github/lock@v2.0.1",
          with: {
            mode: "lock",
            environment: "global",
          },
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
          run: "cndi install", // even though we install automatically in run.ts, we expect this has more performant caching
        },
        {
          name: "cndi run",
          env: {
            GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
            GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
            GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
            SSH_PUBLIC_KEY: "${{ secrets.SSH_PUBLIC_KEY }}",
            TERRAFORM_STATE_PASSPHRASE:
              "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
            SEALED_SECRETS_PRIVATE_KEY:
              "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
            SEALED_SECRETS_PUBLIC_KEY:
              "${{ secrets.SEALED_SECRETS_PUBLIC_KEY }}",
            ARGOCD_ADMIN_PASSWORD: "${{ secrets.ARGOCD_ADMIN_PASSWORD }}",
            AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
            AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
            AWS_REGION: "${{ secrets.AWS_REGION }}",
            GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
            ARM_REGION: "${{ secrets.ARM_REGION }}",
            ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
            ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
            ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
            ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
            CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
          },
          run: "cndi run",
        },
        {
          id: "lock-release",
          uses: "github/lock@v2.0.1",
          if: "always()", // always release the lock even if `cndi run` fails
          with: {
            mode: "unlock",
            environment: "global",
          },
        },
      ],
    },
  },
};

const getWorkflowYaml = (sourceRef?: string) => {
  // export action which uses pre-built cndi binaries
  if (!sourceRef) return YAML.stringify(cndiWorkflowObj);

  // export action which builds cndi on the fly to verify a particular git ref
  const steps = [
    {
      name: "welcome",
      run: `echo "welcome to cndi@${sourceRef}!"`,
    },
    {
      id: "lock-check",
      uses: "github/lock@v2.0.1",
      with: {
        mode: "check",
        environment: "global",
      },
    },
    {
      name: "fail if locked",
      if: "${{ steps.lock-check.outputs.locked != 'false' }}",
      run: "echo \"cndi cannot 'run': deployment in progress\" && exit 1",
    },
    {
      id: "lock-acquire",
      uses: "github/lock@v2.0.1",
      with: {
        mode: "lock",
        environment: "global",
      },
    },
    {
      name: "checkout cndi repo",
      uses: "actions/checkout@v3",
      with: {
        repository: "polyseam/cndi",
        "fetch-depth": 0,
        ref: sourceRef,
      },
    },
    {
      name: "setup deno",
      uses: "denoland/setup-deno@v1",
      with: {
        "deno-version": `v${deno_version}`,
      },
    },
    {
      name: "build cndi",
      run: "deno task build-linux",
    },
    {
      name: "persist cndi",
      run:
        "mkdir -p $HOME/.cndi/bin && mv ./dist/cndi-linux $HOME/.cndi/bin/cndi",
    },
    {
      name: "cndi install",
      run: "$HOME/.cndi/bin/cndi install", // even though we install automatically in run.ts, we expect this has more performant caching
    },
    {
      name: "checkout repo",
      uses: "actions/checkout@v3",
      with: {
        "fetch-depth": 0,
      },
    },
    {
      name: "cndi run",
      run: "$HOME/.cndi/bin/cndi run",
      env: {
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
        AWS_REGION: "${{ secrets.AWS_REGION }}",
        GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
        ARM_REGION: "${{ secrets.ARM_REGION }}",
        ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
        ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
        ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
        ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
        CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
      },
    },
    {
      id: "lock-release",
      uses: "github/lock@v2.0.1",
      if: "always()", // always release the lock even if `cndi run` fails
      with: {
        mode: "unlock",
        environment: "global",
      },
    },
  ];
  return YAML.stringify({
    ...cndiWorkflowObj,
    jobs: { "cndi-run": { steps } },
  });
};
export default getWorkflowYaml;
