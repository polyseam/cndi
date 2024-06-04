import { YAML } from "deps";

import { CNDIConfig } from "src/types.ts";

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
  with?: Record<string, string | number>;
  env?: Record<string, string>;
  if?: string;
  id?: string;
};

function getSteps(config: CNDIConfig, sourceRef?: string) {
  const injectEnv: Record<string, string> = {};

  for (
    const key of Object.keys(config?.infrastructure?.terraform?.variable || {})
  ) {
    const envKey = `TF_VAR_${key.toLowerCase()}`;
    const envVal = `\${{ secrets.TF_VAR_${key.toLowerCase()} }}`;
    injectEnv[envKey] = envVal;
  }

  if (!sourceRef) {
    return [
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
        uses: "polyseam/setup-cndi@v2",
      },
      {
        name: "install awscli 1",
        run: "pip install -U awscli",
      },
      {
        name: "cndi run",
        env: {
          ARM_REGION: "${{ vars.ARM_REGION }}",
          AWS_REGION: "${{ vars.AWS_REGION }}",
          GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
          GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
          GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
          SSH_PUBLIC_KEY: "${{ secrets.SSH_PUBLIC_KEY }}",
          TERRAFORM_STATE_PASSPHRASE:
            "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
          SEALED_SECRETS_PRIVATE_KEY:
            "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
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
          ...injectEnv,
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
    ];
  }

  return [{
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
  }, {
    name: "install awscli 1",
    run: "pip install -U awscli",
  }, {
    name: "cndi run",
    run: "$HOME/.cndi/bin/cndi run",
    env: {
      ARM_REGION: "${{ vars.ARM_REGION }}",

      GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
      GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
      GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
      SSH_PUBLIC_KEY: "${{ secrets.SSH_PUBLIC_KEY }}",
      TERRAFORM_STATE_PASSPHRASE: "${{ secrets.TERRAFORM_STATE_PASSPHRASE }}",
      SEALED_SECRETS_PRIVATE_KEY: "${{ secrets.SEALED_SECRETS_PRIVATE_KEY }}",
      SEALED_SECRETS_PUBLIC_KEY: "${{ secrets.SEALED_SECRETS_PUBLIC_KEY }}",
      ARGOCD_ADMIN_PASSWORD: "${{ secrets.ARGOCD_ADMIN_PASSWORD }}",

      GOOGLE_CREDENTIALS: "${{ secrets.GOOGLE_CREDENTIALS }}",
      ARM_SUBSCRIPTION_ID: "${{ secrets.ARM_SUBSCRIPTION_ID }}",
      ARM_TENANT_ID: "${{ secrets.ARM_TENANT_ID }}",
      ARM_CLIENT_ID: "${{ secrets.ARM_CLIENT_ID }}",
      ARM_CLIENT_SECRET: "${{ secrets.ARM_CLIENT_SECRET }}",
      CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
      ...injectEnv,
    },
  }, {
    id: "lock-release",
    uses: "github/lock@v2.0.1",
    if: "always()", // always release the lock even if `cndi run` fails
    with: {
      mode: "unlock",
      environment: "global",
    },
  }];
}

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

const AWS_STEPS = [
  {
    name: "install awscli 1",
    run: "pip install -U awscli",
  },
];

const AWS_KEYLESS_STEPS = [{
  name: "configure aws credentials",
  uses: "aws-actions/configure-aws-credentials@v3",
  with: {
    "role-to-assume": Deno.env.get("OIDC_RESOURCE_IDENTIFIER"), // Universal or AWS Specific?
    "aws-region": "${{ env.AWS_REGION }}",
  },
}];

const AWS_ENV = {
  AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
  AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
  AWS_REGION: "${{ vars.AWS_REGION }}",
};

const AWS_KEYLESS_ENV = {
  AWS_REGION: "${{ vars.AWS_REGION }}",
};

const getWorkflowObject = (config: CNDIConfig, sourceRef?: string) => {
  const isKeyless = config?.infrastructure?.cndi?.keyless === true;
  const steps: Array<WorkflowStep> = [];
  if (sourceRef) {
    steps.push(...getSourceRefSteps(sourceRef));
  } else {
    steps.push(...LATEST_RELEASE_STEPS);
  }
  if (isKeyless) {
    if (config.provider === "aws") {
      steps.push(...AWS_KEYLESS_STEPS);
    }
  } else {
    steps.push(...AWS_STEPS);
  }
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
      "cndi-run": {
        // TODO: determine min scope
        permissions: "write-all",
        "runs-on": "ubuntu-20.04",
        env: {
          GIT_REPO: "${{ secrets.GIT_REPO }}",
          CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
        },
        steps: getSteps(config, sourceRef),
      },
    },
  };

  return YAML.stringify(cndiWorkflowObj);
};
export default getWorkflowYaml;
