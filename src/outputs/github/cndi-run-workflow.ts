import { YAML } from "deps";

import { CNDIConfig, CNDIProvider } from "src/types.ts";

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
  with?: Record<string, string | number>;
  env?: Record<string, string>;
  if?: string;
  id?: string;
};

const LATEST_RELEASE_STEPS: Array<WorkflowStep> = [{
  name: "welcome",
  run: 'echo "welcome to cndi!"',
}, {
  id: "lock-check",
  uses: "github/lock@v2.0.1",
  with: {
    mode: "check",
    environment: "global",
  },
}, {
  name: "fail if locked",
  if: "${{ steps.lock-check.outputs.locked != 'false' }}",
  run: "echo \"cndi cannot 'run': deployment in progress\" && exit 1",
}, {
  id: "lock-acquire",
  uses: "github/lock@v2.0.1",
  with: {
    mode: "lock",
    environment: "global",
  },
}, {
  name: "checkout repo",
  uses: "actions/checkout@v3",
  with: {
    "fetch-depth": 0,
  },
}, {
  name: "setup cndi",
  uses: "polyseam/setup-cndi@v2",
}];

const getSourceRefSteps = (sourceRef: string): Array<WorkflowStep> => [{
  name: "welcome",
  run: `echo "welcome to cndi@${sourceRef}!"`,
}, {
  id: "lock-check",
  uses: "github/lock@v2.0.1",
  with: {
    mode: "check",
    environment: "global",
  },
}, {
  name: "fail if locked",
  if: "${{ steps.lock-check.outputs.locked != 'false' }}",
  run: "echo \"cndi cannot 'run': deployment in progress\" && exit 1",
}, {
  id: "lock-acquire",
  uses: "github/lock@v2.0.1",
  with: {
    mode: "lock",
    environment: "global",
  },
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
  uses: "denoland/setup-deno@v2",
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
}];

const GLOBAL_ENV = {
  GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
  GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
  GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
  SSH_PUBLIC_KEY: "${{ secrets.SSH_PUBLIC_KEY }}",
  TERRAFORM_STATE_PASSPHRASE: "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
};

const CLUSTER_ENV = {
  SEALED_SECRETS_PRIVATE_KEY: "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
  SEALED_SECRETS_PUBLIC_KEY: "${{ secrets.SEALED_SECRETS_PUBLIC_KEY }}",
  ARGOCD_ADMIN_PASSWORD: "${{ secrets.ARGOCD_ADMIN_PASSWORD }}",
};

const AWS_STEPS: Array<WorkflowStep> = [
  {
    name: "install awscli 1",
    run: "pip install -U awscli",
  },
];

const GCP_STEPS: Array<WorkflowStep> = [
  //# 1. Download Google’s APT GPG key and store it in /usr/share/keyrings
  {
    run: `curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg`,
  },
  //# 2. Add the Cloud SDK APT repo, pointing to that keyring
  {
    run: `echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] \
  https://packages.cloud.google.com/apt cloud-sdk main" \
  | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list`,
  },
  {
    run:
      "sudo apt-get update && sudo apt-get install google-cloud-cli-gke-gcloud-auth-plugin",
  },
];

const AWS_STEPS_KEYLESS: Array<WorkflowStep> = [{
  name: "configure aws credentials",
  uses: "aws-actions/configure-aws-credentials@v3",
  with: {
    "role-to-assume": "${{ secrets.AWS_OIDC_ROLE_TO_ASSUME_ARN }}",
    "aws-region": Deno.env.get("AWS_REGION")! || "us-east-1",
  },
}, {
  name: "install awscli 1",
  run: "pip install -U awscli",
}];

const AZURE_STEPS_KEYLESS: Array<WorkflowStep> = [{
  name: "Az CLI login",
  uses: "azure/login@v1",
  with: {
    "client-id": "${{ secrets.ARM_CLIENT_ID }}",
    "tenant-id": "${{ secrets.ARM_TENANT_ID }}",
    "subscription-id": "${{ secrets.ARM_SUBSCRIPTION_ID }}",
  },
}];

const GCPAuthActionVersion = "v0.4.0";

const GCP_STEPS_KEYLESS: Array<WorkflowStep> = [
  {
    id: "auth",
    name: "Authenticate with Google Cloud",
    uses: `google-github-actions/auth@${GCPAuthActionVersion}`,
    with: {
      workload_identity_provider:
        "${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}",
      service_account: "${{ secrets.GCP_SERVICE_ACCOUNT }}",
      audience: "${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}",
    },
  },
];

const getProviderSteps = (
  provider: CNDIProvider,
  keyless = false,
): Array<WorkflowStep> => {
  // keyless MUST be false for now
  keyless = false;

  switch (provider) {
    case "aws":
      return keyless ? AWS_STEPS_KEYLESS : AWS_STEPS;
    case "azure":
      return keyless ? AZURE_STEPS_KEYLESS : [];
    case "gcp":
      return keyless ? GCP_STEPS_KEYLESS : GCP_STEPS;
    default:
      return [];
  }
};

const AWS_ENV = {
  AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
  AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
};

const GOOGLE_ENV = {
  GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
  USE_GKE_GCLOUD_AUTH_PLUGIN: "True",
};

const GOOGLE_ENV_KEYLESS = {
  GCP_SERVICE_ACCOUNT: "${{ secrets.GCP_SERVICE_ACCOUNT }}",
  GCP_WORKLOAD_IDENTITY_PROVIDER:
    "${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}",
};

const AZURE_ENV = {
  ARM_REGION: "${{ vars.ARM_REGION }}",
  ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
  ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
  ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
  ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
};

const AZURE_ENV_KEYLESS = {
  ARM_REGION: "${{ vars.ARM_REGION }}",
  ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
  ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
  ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
};

const getEnv = (
  config: CNDIConfig,
  keyless = false,
): Record<string, string> => {
  // keyless MUST be false for now
  keyless = false;
  // if config.infrastructure.terraform.variable has values, inject them as env vars to GitHub Workflow
  const injectEnv: Record<string, string> = {};

  for (
    const key of Object.keys(config?.infrastructure?.terraform?.variable || {})
  ) {
    const envKey = `TF_VAR_${key.toUpperCase()}`;
    const envVal = `\${{ secrets.TF_VAR_${key.toUpperCase()} }}`;
    injectEnv[envKey] = envVal;
  }

  let env = {
    ...GLOBAL_ENV,
    ...injectEnv,
  };

  if (config.distribution !== "clusterless") {
    env = {
      ...env,
      ...CLUSTER_ENV,
    };
  }

  switch (config.provider) {
    case "aws":
      env = {
        ...env,
        ...(keyless ? {} : AWS_ENV),
      };
      break;
    case "gcp":
      env = {
        ...env,
        ...(keyless ? GOOGLE_ENV_KEYLESS : GOOGLE_ENV),
      };
      break;
    case "azure":
      env = {
        ...env,
        ...(keyless ? AZURE_ENV_KEYLESS : AZURE_ENV),
      };
      break;
    default:
      break;
  }

  return env;
};

type WorkflowJob = {
  permissions: string;
  "runs-on": string;
  env: Record<string, string>;
  steps: Array<WorkflowStep>;
};

const getWorkflowJob = (
  config: CNDIConfig,
  sourceRef?: string,
): WorkflowJob => {
  // TODO: const isKeyless = config?.infrastructure?.cndi?.keyless === true;
  const isKeyless = false;
  const steps: Array<WorkflowStep> = [];

  // sourceRef is used to build the cndi binary from a provided git ref
  if (sourceRef) {
    steps.push(...getSourceRefSteps(sourceRef));
  } else {
    // if no sourceRef is provided, use the latest GitHub Release
    steps.push(...LATEST_RELEASE_STEPS);
  }

  steps.push(...getProviderSteps(config.provider, isKeyless));

  const env = getEnv(config, isKeyless);

  steps.push({
    name: "cndi run",
    run: sourceRef ? "$HOME/.cndi/bin/cndi run" : "cndi run",
    env,
  }, {
    id: "lock-release",
    uses: "github/lock@v2.0.1",
    if: "always()", // always release the lock even if `cndi run` fails
    with: {
      mode: "unlock",
      environment: "global",
    },
  });

  return {
    permissions: "write-all",
    "runs-on": "ubuntu-latest",
    env: {
      GIT_REPO: "${{ secrets.GIT_REPO }}",
      CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
    },
    steps,
  };
};

const getWorkflowYaml = (
  config: CNDIConfig,
  sourceRef?: string,
  disable = false,
) => {
  const on = disable ? {} : {
    push: {
      branches: ["main", "releases/**"],
    },
  };

  const cndiWorkflowObj = {
    name: "cndi",
    on,
    jobs: {
      "cndi-run": getWorkflowJob(config, sourceRef),
    },
  };

  return YAML.stringify(cndiWorkflowObj);
};

export default getWorkflowYaml;
