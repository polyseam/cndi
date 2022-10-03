// list of all commands for the CLI

export const enum Command {
  init = "init",
  "overwrite-with" = "overwrite-with",
  run = "run",
  help = "help",
  default = "default",
  install = "install",
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
  instanceType?: string;
  imageId?: string;
}

interface CNDINodes {
  entries: Array<CNDINode>;
  deploymentTargetConfiguration: {
    aws: {
      region: string;
      instanceType: string;
    };
  };
}

// incomplete type, config will have more options
interface CNDIConfig {
  nodes: CNDINodes;
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
  outputDirectory: string;
  githubDirectory: string;
  dotEnvPath: string;
  pathToConfig: string;
  pathToNodes: string;
  binaryForPlatform: string;
  noGitHub: boolean;
  noDotEnv: boolean;
}

// incomplete type, NodeSpec will have more options
// NodeSpec is the user-specified config for a node
interface NodeSpec {
  name: string;
  role: NodeRole;
  kind: "aws";
  InstanceType?: string;
}

// incomplete type, NodeEntry will probably have more options
// NodeEntry is the user-specified config for a node + data returned from deployment target
interface NodeEntry extends NodeSpec {
  ready: boolean;
  id?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
}

interface CNDIClients {
  // deno-lint-ignore no-explicit-any
  aws?: any;
}

export type {
  CNDIApplicationSpec,
  CNDIClients,
  CNDIConfig,
  CNDIContext,
  CNDINode,
  CNDINodes,
  NodeEntry,
  NodeSpec,
};
