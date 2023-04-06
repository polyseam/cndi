// https://youtu.be/jjMbPt_H3RQ?t=303 Pocock Wizardry
type ObjectValues<T> = T[keyof T];

export const NODE_KIND = {
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
} as const;

export const DEPLOYMENT_TARGET = {
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
} as const;

export const SECRET_TYPES = {
  Opaque: "Opaque",
  "kubernetes.io/dockerconfigjson": "kubernetes.io/dockerconfigjson",
  "kubernetes.io/service-account-token": "kubernetes.io/service-account-token",
  "kubernetes.io/dockercfg": "kubernetes.io/dockercfg",
  "kubernetes.io/tls": "kubernetes.io/tls",
  "bootstrap.kubernetes.io/token": "bootstrap.kubernetes.io/token",
  "kubernetes.io/ssh-auth": "kubernetes.io/ssh-auth",
  "kubernetes.io/basic-auth": "kubernetes.io/basic-auth",
} as const;

export const COMMAND = {
  init: "init",
  overwrite: "overwrite",
  run: "run",
  help: "help",
  default: "default",
  install: "install",
  terraform: "terraform",
  ow: "ow",
  destroy: "destroy",
} as const;

export const NODE_ROLE = {
  leader: "leader",
  controller: "controller",
} as const;

// NodeRole refers to the role of the node, e.g. leader, controller.. worker in the future?
export type NodeRole = ObjectValues<typeof NODE_ROLE>;

// NodeKind refers to the type of node, e.g. AWS EC2, GCP CE, etc.
export type NodeKind = ObjectValues<typeof NODE_KIND>;

// DeploymentTarget refers to the type of deployment target, e.g. AWS, GCP, etc.
export type DeploymentTarget = ObjectValues<typeof DEPLOYMENT_TARGET>;

// a map of all available commands in the cndi binary
export type Command = ObjectValues<typeof COMMAND>;

// cndi-config.jsonc["infrastructure"]["cndi"]["nodes"]["*"]
interface BaseNodeItemSpec {
  name: string;
  kind: NodeKind;
  role?: NodeRole; // default: controller
  volume_size?: number; // we use this when writing config regardless of the provider, but support provider-native keys too
}

// cndi-config.jsonc["nodes"][kind==="azure"]
interface AzureNodeItemSpec extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number;
  volume_size?: number;
  disk_size_gb?: number;
  instance_type?: string;
}

// cndi-config.jsonc["nodes"]["entries"][kind==="aws"]
interface AWSNodeItemSpec extends BaseNodeItemSpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
  volume_size?: number;
  size?: number;
  machine_type?: string;
}

// cndi-config.jsonc["nodes"]["entries"][kind==="gcp"]
interface GCPNodeItemSpec extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number;
  volume_size?: number;
  instance_type?: string;
}

// cndi-config.jsonc["nodes"]["deployment_target_configuration"]["aws"]
interface AWSDeploymentTargetConfiguration extends BaseNodeItemSpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
}

// cndi-config.jsonc["nodes"]["deployment_target_configuration"]["azure"]
interface AzureDeploymentTargetConfiguration extends BaseNodeItemSpec {
  image?: string;
  machine_type?: string;
  disk_size_gb?: number;
  size?: number | string;
}

// cndi-config.jsonc["nodes"]["deployment_target_configuration"]["gcp"]
interface GCPDeploymentTargetConfiguration extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number;
}

// incomplete type, nodes will have more options
interface CNDINode {
  name: string;
  role: NodeRole;
  kind: NodeKind;
  instance_type?: string;
  ami?: string;
  machine_type?: string;
  image?: string;
  size?: number;
}

interface DeploymentTargetConfiguration {
  aws: AWSDeploymentTargetConfiguration;
  gcp: GCPDeploymentTargetConfiguration;
  azure: AzureDeploymentTargetConfiguration;
}

type TFBlocks = {
  terraform?: {
    [key: string]: unknown;
  };
  provider?: {
    [key: string]: unknown;
  };
  variable?: {
    [key: string]: unknown;
  };
  locals?: {
    [key: string]: unknown;
  };
  data?: {
    [key: string]: unknown;
  };
  resource?: {
    [key: string]: unknown;
  };
  module?: {
    [key: string]: unknown;
  };
};

// incomplete type, config will have more options
interface CNDIConfig {
  project_name?: string;
  cndi_version?: string;
  infrastructure: {
    cndi: {
      deployment_target_configuration?: DeploymentTargetConfiguration;
      nodes: Array<BaseNodeItemSpec>;
    };
    terraform?: TFBlocks;
  };
  applications: {
    [key: string]: CNDIApplicationSpec;
  };
  cluster_manifests: {
    [key: string]: unknown;
  };
}

interface KubernetesManifest {
  cndiVersion: string;
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
  isPlaceholder: boolean;
}

interface EnvCommentEntry {
  comment: string;
}
interface EnvValueEntry {
  value: { [key: string]: string };
}

type EnvLines = Array<EnvCommentEntry | EnvValueEntry>;

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

interface SealedSecretsKeys {
  sealed_secrets_private_key: string;
  sealed_secrets_public_key: string;
}

export type {
  AWSDeploymentTargetConfiguration,
  AWSNodeItemSpec,
  AzureDeploymentTargetConfiguration,
  AzureNodeItemSpec,
  BaseNodeItemSpec,
  CNDIApplicationSpec,
  CNDIConfig,
  CNDINode,
  DeploymentTargetConfiguration,
  EnvCommentEntry,
  EnvLines,
  EnvValueEntry,
  GCPDeploymentTargetConfiguration,
  GCPNodeItemSpec,
  KubernetesManifest,
  KubernetesSecret,
  KubernetesSecretWithStringData,
  SealedSecretsKeys,
  TFBlocks,
};
