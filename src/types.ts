// list of all commands for the CLI

export const enum NodeKind {
  aws = "aws",
}

export const enum Command {
  init = "init",
  "overwrite-with" = "overwrite-with",
  run = "run",
  help = "help",
  default = "default",
  install = "install",
  ow = "ow",
}

// node.role is either "controller" or "worker"
export const enum NodeRole {
  controller = "controller",
  worker = "worker",
}

// incomplete type, nodes will have more options
interface CNDINode {
  name: string;
  role: NodeRole;
  kind: NodeKind;
  instance_type?: string;
  ami?: string;
}

interface CNDINodesSpec {
  entries: Array<BaseNodeEntrySpec>;
  deploymentTargetConfiguration: DeploymentTargetConfiguration;
}

// cndi-config.jsonc["nodes"]["entries"][kind==="aws"]
interface AWSNodeEntrySpec extends BaseNodeEntrySpec {
  ami: string;
  instance_type: string;
  availability_zone: string;
}

// cndi-config.jsonc["nodes"]["deploymentTargetConfiguration"]["aws"]
interface AWSDeploymentTargetConfiguration extends BaseNodeEntrySpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
}

interface AWSTerraformNodeResource {
  resource: {
    aws_instance: {
      [name: string]: Array<{
        ami: string;
        instance_type: string;
        availability_zone: string;
        tags: {
          Name: string;
          CNDINodeRole: NodeRole;
        };
        user_data?: string;
        depends_on?: Array<string>;
        ebs_block_device?: Array<{
          device_name: string;
          volume_size: number;
          volume_type: string;
          delete_on_termination: boolean;
        }>;
      }>;
    };
  };
}

interface DeploymentTargetConfiguration {
  aws: AWSDeploymentTargetConfiguration;
  gcp: unknown;
  azure: unknown;
}

// incomplete type, config will have more options
interface CNDIConfig {
  nodes: CNDINodesSpec;
  applications: {
    [key: string]: CNDIApplicationSpec;
  };
  cluster: {
    [key: string]: unknown;
  };
}

interface KubernetesManifest {
  apiVersion: string;
  kind: string;
}

interface KubernetesSecret extends KubernetesManifest {
  kind: "Secret";
  data?: {
    [key: string]: string;
  };
  stringData?: {
    [key: string]: string;
  };
  metadata: {
    name: string;
  };
}

interface KubernetesSecretWithStringData extends KubernetesSecret {
  stringData: {
    [key: string]: string;
  };
}

interface CNDIApplicationSpec {
  targetRevision: string;
  repoURL: string;
  destinationNamespace: string;
  chart?: string;
  values: {
    [key: string]: unknown;
  };
}

interface CNDIContext {
  CNDI_HOME: string;
  CNDI_SRC: string;
  projectDirectory: string;
  projectCndiDirectory: string;
  githubDirectory: string;
  dotEnvPath: string;
  pathToConfig: string;
  pathToTerraformResources: string;
  pathToKubernetesManifests: string;
  pathToTerraformBinary: string;
  pathToCNDIBinary: string;
  fileSuffixForPlatform: string;
  noGitHub: boolean;
  noDotEnv: boolean;
  pathToOpenSSL: string;
  pathToKeys: string;
  pathToKubeseal: string;
  gitignorePath: string;
  noKeys: boolean;
}

// cndi-config.jsonc["nodes"]["entries"][*]
interface BaseNodeEntrySpec {
  name: string;
  role: NodeRole;
  kind: NodeKind;
}

interface CNDIClients {
  // deno-lint-ignore no-explicit-any
  aws?: any;
}

interface TerraformDependencies {
  required_providers: Array<{
    [key: string]: {
      source: string;
      version: string;
    };
  }>;
  required_version: string;
}

interface TerraformRootFileData {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}";
      controller_node_ip: string;
      git_password: "${var.git_password}";
      git_username: "${var.git_username}";
      git_repo: "${var.git_repo}";
      argoui_readonly_password: "${var.argoui_readonly_password}";
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}";
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}";
    },
  ];
  provider: {
    random: [Record<never, never>]; // equal to [{}]
    aws: [Record<never, never>]; // equal to [{}]
  };
  resource: {
    random_password: {
      generated_token: [
        {
          length: 32;
          special: false;
          upper: false;
        },
      ];
    };
  };
  terraform: [TerraformDependencies];
  variable: {
    git_password: [
      {
        description: "password for accessing the repositories";
        type: "string";
      },
    ];
    git_username: [
      {
        description: "password for accessing the repositories";
        type: "string";
      },
    ];
    git_repo: [
      {
        description: "repository URL to access";
        type: "string";
      },
    ];
    sealed_secrets_private_key: [
      {
        description: "private key for decrypting sealed secrets";
        type: "string";
      },
    ];
    sealed_secrets_public_key: [
      {
        description: "public key for encrypting sealed secrets";
        type: "string";
      },
    ];
    argoui_readonly_password: [
      {
        description: "password for accessing the argo ui";
        type: "string";
      },
    ];
  };
}

interface SealedSecretsKeys {
  sealed_secrets_private_key: string;
  sealed_secrets_public_key: string;
}

export type {
  AWSDeploymentTargetConfiguration,
  AWSNodeEntrySpec,
  AWSTerraformNodeResource,
  BaseNodeEntrySpec,
  CNDIApplicationSpec,
  CNDIClients,
  CNDIConfig,
  CNDIContext,
  CNDINode,
  CNDINodesSpec,
  DeploymentTargetConfiguration,
  KubernetesManifest,
  KubernetesSecret,
  KubernetesSecretWithStringData,
  SealedSecretsKeys,
  TerraformDependencies,
  TerraformRootFileData,
};
