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
  region?: string;
  availability_zone?: string;
}

interface AWSTerraformProviderConfiguration {
  profile: string;
  region: string;
}

interface AWSTerraformNodeResource {
  resource: {
    aws_instance: {
      [name: string]: Array<{ami: string, instance_type: string, availability_zone: string, 
        tags:{
          Name: string,
          CNDINodeRole: NodeRole,
        },
        user_data?: string,
        depends_on?: Array<string>,
      }>
    }
  }
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
  CNDI_WORKING_DIR: string;
  projectDirectory: string;
  projectCndiDirectory: string;
  githubDirectory: string;
  dotEnvPath: string;
  pathToConfig: string;
  pathToNodes: string;
  binaryForPlatform: string;
  noGitHub: boolean;
  noDotEnv: boolean;
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
    [key:string]:{
      source: string;
      version: string;
    }
  }>,
  required_version: string,
}

interface TerraformRootFileData {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}";
      controller_node_ip: string;
      git_password: "${var.git_password}";
      git_username: "${var.git_username}";
      git_repo: "${var.git_repo}";
    }
  ];
  provider: {
    // deno-lint-ignore ban-types
    random: [{}];
    aws?: [{}];
  };
  resource: {
    random_password: {
      generated_token: [
        {
          length: 32;
          special: false;
          upper: false;
        }
      ];
    };
  };
  terraform: [
    TerraformDependencies
  ];
  variable: {
    git_password: [
      {
        description: "password for accessing the repositories";
        type: "string";
      }
    ];
    git_username: [
      {
        description: "password for accessing the repositories";
        type: "string";
      }
    ];
    git_repo: [
      {
        description: "repository URL to access";
        type: "string";
      }
    ];
  };
}

export type {
  CNDIApplicationSpec,
  CNDIClients,
  CNDIConfig,
  CNDIContext,
  CNDINode,
  CNDINodesSpec,
  BaseNodeEntrySpec,
  AWSNodeEntrySpec,
  AWSDeploymentTargetConfiguration,
  DeploymentTargetConfiguration,
  TerraformRootFileData,
  AWSTerraformProviderConfiguration,
  AWSTerraformNodeResource,
  TerraformDependencies,
};
