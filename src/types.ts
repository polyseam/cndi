// https://youtu.be/jjMbPt_H3RQ?t=303 Pocock Wizardry
type ObjectValues<T> = T[keyof T];
import { MANAGED_NODE_KINDS } from "./constants.ts";

export type ManagedNodeKind = typeof MANAGED_NODE_KINDS[number];

import type { CNDIApplicationSpec } from "src/outputs/application-manifest.ts";

export const NODE_KIND = {
  aws: "aws",
  eks: "eks",
  ec2: "ec2",
  gcp: "gcp",
  azure: "azure",
  aks: "aks",
  dev: "dev",
  gke: "gke",
} as const;

export const DEPLOYMENT_TARGET = {
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  dev: "dev",
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
  worker: "worker",
} as const;

// NodeRole refers to the role of the node, e.g. leader, controller.. worker in the future?
export type NodeRole = ObjectValues<typeof NODE_ROLE>;

// NodeKind refers to the type of node, e.g. AWS EC2, GCP CE, etc.
export type NodeKind = ObjectValues<typeof NODE_KIND>;

// DeploymentTarget refers to the type of deployment target, e.g. AWS, GCP, etc.
export type DeploymentTarget = ObjectValues<typeof DEPLOYMENT_TARGET>;

// a map of all available commands in the cndi binary
export type Command = ObjectValues<typeof COMMAND>;

// cndi_config.jsonc["infrastructure"]["cndi"]["nodes"]["*"]
export interface CNDINodeSpec {
  name: string;
  role?: NodeRole; // default: controller
  volume_size?: number;
  size?: number | string; // number: 500 or string: az machine type
  disk_size_gb?: number;
  disk_size?: number;
  disk_type?: string;
  instance_type?: string;
  machine_type?: string;
  min_count?: number;
  max_count?: number;
  count?: number;
  labels?: Label;
  taints?: Taint[];
}

interface Label {
  [key: string]: string;
}

type CNDITaintEffect = "NoSchedule" | "PreferNoSchedule" | "NoExecute";
interface Taint {
  key: string;
  value: string;
  effect: CNDITaintEffect;
}

// cndi_config.jsonc["nodes"][kind==="dev"]
interface MultipassNodeItemSpec extends CNDINodeSpec {
  name: string;
  cpus?: number;
  memory?: number | string; // if integer, assume G
  disk?: number | string; // if integer, assume G
  disk_size_gb?: number;
  volume_size?: number;
  disk_size?: number;
}

// cndi_config.jsonc["nodes"][kind==="azure"]
interface AzureNodeItemSpec extends CNDINodeSpec {
  machine_type?: string;
  image?: string;
  size?: number | string;
  volume_size?: number;
  disk_size_gb?: number;
  instance_type?: string;
}

interface AzureAKSNodeItemSpec extends CNDINodeSpec {
  agents_min_count?: number;
  agents_max_count?: number;
  agents_size?: string;
  os_disk_size_gb?: number;
  machine_type?: string;
  image?: string;
  size?: number | string;
  volume_size?: number;
  disk_size_gb?: number;
  instance_type?: string;
}
// cndi_config.jsonc["nodes"]["entries"][kind==="aws"]
interface AWSEC2NodeItemSpec extends CNDINodeSpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
  volume_size?: number;
  size?: number;
  disk_size?: number;
  machine_type?: string;
}

// cndi_config.jsonc["nodes"]["entries"][kind==="eks"]
type AWSEKSNodeItemSpec = Omit<AWSEC2NodeItemSpec, "ami"> & {
  min_count: number;
  max_count: number;
};

// cndi_config.jsonc["nodes"]["entries"][kind==="gcp"]
interface GCPNodeItemSpec extends CNDINodeSpec {
  machine_type?: string;
  image?: string;
  size?: number;
  volume_size?: number;
  instance_type?: string;
}

// cndi_config.jsonc["nodes"]["entries"][kind==="gke"]
interface GKENodeItemSpec extends CNDINodeSpec {
  min_count?: number;
  max_count?: number;
  machine_type?: string;
  size?: number;
  volume_size?: number;
  disk_size_gb?: number;
  instance_type?: string;
  disk_type?: string;
}

// cndi_config.jsonc["nodes"]["deployment_target_configuration"]["aws"]
interface AWSDeploymentTargetConfiguration extends CNDINodeSpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
  size?: number;
}

// cndi_config.jsonc["nodes"]["deployment_target_configuration"]["azure"]
interface AzureDeploymentTargetConfiguration extends CNDINodeSpec {
  image?: string;
  machine_type?: string;
  disk_size_gb?: number;
  size?: number | string; // this can be a string if it refers to a machine type which azure named "size"
}

// cndi_config.jsonc["nodes"]["deployment_target_configuration"]["gcp"]
interface GCPDeploymentTargetConfiguration extends CNDINodeSpec {
  machine_type?: string;
  image?: string;
  size?: number;
}

interface DeploymentTargetConfiguration {
  aws: AWSDeploymentTargetConfiguration;
  gcp: GCPDeploymentTargetConfiguration;
  azure: AzureDeploymentTargetConfiguration;
}

type Microk8sAddon = {
  name: string;
  enabled?: boolean;
  args?: string[];
};

type TFBlockVariable = {
  type: "string" | "number" | "bool" | "list" | "map";
  description?: string;
  sensitive?: boolean;
};

type TFBlocks = {
  terraform?: {
    [key: string]: unknown;
  };
  provider?: {
    [key: string]: unknown;
  };
  variable?: {
    [key: string]: TFBlockVariable;
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
  output?: {
    [key: string]: unknown;
  };
};

interface CNDIPort {
  name: string;
  service?: string;
  namespace?: string;
  number: number;
  disable?: boolean;
  private?: boolean;
}

export type CNDINetworkMode = "create" | "insert";

export interface CNDINetworkConfigBase {
  mode?: CNDINetworkMode;
}

export interface CNDINetworkConfigcreate extends CNDINetworkConfigBase {
  mode: "create";
  vnet_address_space?: string;
  subnet_address_space?: string;
}

export interface CNDINetworkConfigInsert extends CNDINetworkConfigBase {
  mode: "insert";
  /**
   * unique identifier for the network to create your cndi subnet in
   */
  vnet_identifier: string;
  /**
   * A set of one or more subnets to use for the cluster.
   */
  vnet_address_space?: string;
  subnet_address_space?: string;
}

export type CNDINetworkConfig =
  | CNDINetworkConfigcreate
  | CNDINetworkConfigInsert;

// https://github.com/bitnami/charts/blob/16f3174da9441d2bf6c2355ab0afe94d4a7a9e48/bitnami/external-dns/values.yaml#L112
export type ExternalDNSProvider =
  | "akamai"
  | "alibabacloud"
  | "aws"
  | "azure"
  | "azure-private-dns"
  | "cloudflare"
  | "coredns"
  | "designate"
  | "digitalocean"
  | "google"
  | "hetzner"
  | "infoblox"
  | "linode"
  | "rfc2136"
  | "transip"
  | "oci";

export type CNDIProvider = "aws" | "azure" | "gcp" | "dev";
export type CNDIDistribution =
  | "microk8s"
  | "eks"
  | "gke"
  | "aks"
  | "clusterless";

type CNDIObservability = {
  enabled: boolean;
  grafana?: {
    hostname?: string;
  };
  kube_prometheus_stack?: {
    enabled: boolean;
    values: Record<string, unknown>;
    targetRevision: string;
  };
  promtail?: {
    enabled: boolean;
    values: Record<string, unknown>;
    targetRevision: string;
  };
  loki?: {
    enabled: boolean;
    values: Record<string, unknown>;
    targetRevision: string;
  };
};

export type CNDIFnsConfig = {
  hostname?: string;
  noModuleCache?: boolean;
  maxMemoryLimitMb?: number;
  cpuTimeHardLimitMs?: number;
  cpuTimeSoftLimitMs?: number;
  workerTimeoutMs?: number;
  edgeRuntimeImageTag?: string;
};

export type CNDIInfrastructure = {
  cndi: {
    network: CNDINetworkConfig;
    functions?: CNDIFnsConfig;
    observability?: CNDIObservability;
    keyless?: boolean; // default: false
    deployment_target_configuration?: DeploymentTargetConfiguration;
    ingress: {
      nginx: {
        public: {
          enabled?: boolean; // default: true
          values?: Record<string, unknown>;
        };
        private: {
          enabled?: boolean; // default: false
          values?: Record<string, unknown>;
        };
      };
    };
    external_dns: {
      enabled?: boolean; // default: true
      provider: ExternalDNSProvider;
      domain_filters: Array<string>;
      values?: Record<string, unknown>;
    };
    reloader: {
      enabled?: boolean; // default: true
      values?: Record<string, unknown>;
    };
    cert_manager?: {
      enabled?: boolean; // default: true
      email: string;
      self_signed?: boolean;
      values?: Record<string, unknown>;
    };
    nodes: Array<CNDINodeSpec>;
    microk8s: {
      addons: Array<Microk8sAddon>;
      version?: string; // 1.27
      channel?: string; // stable
      "cloud-init": {
        leader_before: Array<string>; //
        leader_after: Array<string>;
      };
    };
    argocd: {
      hostname?: string; // auto ingress if set
      root_application: unknown; //
      install_url?: string; //
    };
    open_ports?: Array<CNDIPort>;
  };
  terraform?: TFBlocks;
};

// incomplete type, config will have more options
interface CNDIConfig {
  project_name?: string;
  cndi_version?: string;
  distribution: CNDIDistribution;
  provider: CNDIProvider;
  infrastructure: CNDIInfrastructure;
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
    namespace?: string;
  };
  isPlaceholder: boolean;
}

interface EnvCommentEntry {
  comment: string;
}
interface EnvValueEntry {
  value: { [key: string]: string };
  wrap?: boolean;
}

type EnvLines = Array<EnvCommentEntry | EnvValueEntry>;

interface KubernetesSecretWithStringData extends KubernetesSecret {
  stringData: {
    [key: string]: string;
  };
}

interface SealedSecretsKeys {
  sealed_secrets_private_key: string;
  sealed_secrets_public_key: string;
}

interface SshKeys {
  ssh_private_key: string;
  ssh_public_key: string;
}

export type {
  AWSDeploymentTargetConfiguration,
  AWSEC2NodeItemSpec,
  AWSEKSNodeItemSpec,
  AzureAKSNodeItemSpec,
  AzureDeploymentTargetConfiguration,
  AzureNodeItemSpec,
  CNDIApplicationSpec,
  CNDIConfig,
  CNDIPort,
  CNDITaintEffect,
  DeploymentTargetConfiguration,
  EnvCommentEntry,
  EnvLines,
  EnvValueEntry,
  GCPDeploymentTargetConfiguration,
  GCPNodeItemSpec,
  GKENodeItemSpec,
  KubernetesManifest,
  KubernetesSecret,
  KubernetesSecretWithStringData,
  Label,
  Microk8sAddon,
  MultipassNodeItemSpec,
  SealedSecretsKeys,
  SshKeys,
  Taint,
  TFBlocks,
};
