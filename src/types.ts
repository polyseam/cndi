// https://youtu.be/jjMbPt_H3RQ?t=303 Pocock Wizardry
type ObjectValues<T> = T[keyof T];
import { MANAGED_NODE_KINDS } from "./constants.ts";

export type ManagedNodeKind = typeof MANAGED_NODE_KINDS[number];

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
interface BaseNodeItemSpec {
  name: string;
  role?: NodeRole; // default: controller
  volume_size?: number;
  size?: number | string;
  disk_size_gb?: number;
  disk_size?: number;
  instance_type?: string;
  machine_type?: string;
  min_count?: number;
  max_count?: number;
  count?: number;
  disk_type?: string;
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
interface MultipassNodeItemSpec extends BaseNodeItemSpec {
  name: string;
  cpus?: number;
  memory?: number | string; // if integer, assume G
  disk?: number | string; // if integer, assume G
  disk_size_gb?: number;
  volume_size?: number;
  disk_size?: number;
}

// cndi_config.jsonc["nodes"][kind==="azure"]
interface AzureNodeItemSpec extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number | string;
  volume_size?: number;
  disk_size_gb?: number;
  instance_type?: string;
}

interface AzureAKSNodeItemSpec extends BaseNodeItemSpec {
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
interface AWSEC2NodeItemSpec extends BaseNodeItemSpec {
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
interface GCPNodeItemSpec extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number;
  volume_size?: number;
  instance_type?: string;
}

// cndi_config.jsonc["nodes"]["entries"][kind==="gke"]
interface GKENodeItemSpec extends BaseNodeItemSpec {
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
interface AWSDeploymentTargetConfiguration extends BaseNodeItemSpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
  size?: number;
}

// cndi_config.jsonc["nodes"]["deployment_target_configuration"]["azure"]
interface AzureDeploymentTargetConfiguration extends BaseNodeItemSpec {
  image?: string;
  machine_type?: string;
  disk_size_gb?: number;
  size?: number | string; // this can be a string if it refers to a machine type which azure named "size"
}

// cndi_config.jsonc["nodes"]["deployment_target_configuration"]["gcp"]
interface GCPDeploymentTargetConfiguration extends BaseNodeItemSpec {
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

// incomplete type, config will have more options
interface CNDIConfig {
  project_name?: string;
  cndi_version?: string;
  distribution: CNDIDistribution;
  provider: CNDIProvider;
  infrastructure: {
    cndi: {
      deployment_target_configuration?: DeploymentTargetConfiguration;
      keyless?: boolean; // default: false
      ingress: {
        nginx: {
          public: {
            enabled?: boolean; // default: true
            values: Record<string, unknown>;
          };
          private: {
            enabled?: boolean; // default: true
            values: Record<string, unknown>;
          };
        };
      };
      external_dns: {
        enabled?: boolean; // default: true
        provider: ExternalDNSProvider;
        domain_filters: Array<string>;
        values: Record<string, unknown>;
      };
      reloader: {
        enabled?: boolean; // default: true
      };
      cert_manager?: {
        enabled?: boolean; // default: true
        email: string;
        self_signed?: boolean;
      };
      nodes: Array<BaseNodeItemSpec>;
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
        root_application: unknown; //
        install_url?: string; //
      };
      open_ports?: Array<CNDIPort>;
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
  BaseNodeItemSpec,
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
