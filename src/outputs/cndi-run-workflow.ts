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

const AWS_KEYLESS_STEPS: Array<WorkflowStep> = [{
  name: "configure aws credentials",
  uses: "aws-actions/configure-aws-credentials@v3",
  with: {
    "role-to-assume": "${{ secrets.OIDC_AWS_ROLE_TO_ASSUME_ARN }}",
    "aws-region": "${{ env.AWS_REGION }}",
  },
}];

const getProviderSteps = (
  provider: CNDIProvider,
  keyless = false,
): Array<WorkflowStep> => {
  switch (provider) {
    case "aws":
      return keyless ? AWS_KEYLESS_STEPS : AWS_STEPS;
    default:
      return [];
  }
};

const AWS_ENV = {
  AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
  AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
  AWS_REGION: "${{ vars.AWS_REGION }}",
};

const AWS_ENV_KEYLESS = {
  AWS_REGION: "${{ vars.AWS_REGION }}",
};

const GOOGLE_ENV = {
  GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
};

const AZURE_ENV = {
  ARM_REGION: "${{ vars.ARM_REGION }}",
  ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
  ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
  ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
  ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
};

const getEnv = (
  config: CNDIConfig,
  keyless = false,
): Record<string, string> => {
  // if config.infrastructure.terraform.variable has values, inject them as env vars to GitHub Workflow
  const injectEnv: Record<string, string> = {};

  for (
    const key of Object.keys(config?.infrastructure?.terraform?.variable || {})
  ) {
    const envKey = `TF_VAR_${key.toLowerCase()}`;
    const envVal = `\${{ secrets.TF_VAR_${key.toLowerCase()} }}`;
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
        ...(keyless ? AWS_ENV_KEYLESS : AWS_ENV),
      };
      break;
    case "gcp":
      env = {
        ...env,
        ...GOOGLE_ENV,
      };
      break;
    case "azure":
      env = {
        ...env,
        ...AZURE_ENV,
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
  const isKeyless = config?.infrastructure?.cndi?.keyless === true;
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
    "runs-on": "ubuntu-20.04",
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
