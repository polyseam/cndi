import { EFFECT_VALUES, MANAGED_NODE_KINDS } from "consts";

type ObjectValues<T> = T[keyof T];

export type CNDIProvider = "aws" | "azure" | "gcp" | "dev" | "bare";

export type CNDIDistribution =
  | "eks"
  | "clusterless"
  | "gke"
  | "aks"
  | "microk8s"
  | "k3s";

export type CNDIVersion = "v2" | "v3";

export interface CNDIConfigSpec {
  cndi_version: CNDIVersion; // default: v3
  project_name: string;
  region?: string;
  provider: CNDIProvider;
  distribution: CNDIDistribution;
  infrastructure: CNDIInfrastructureSpec; // Required in schema
  applications?: {
    [key: string]: CNDIApplicationSpec;
  };
  cluster_manifests?: {
    [key: string]: unknown;
  };
}

export interface NormalizedCNDIConfig extends CNDIConfigSpec {
  applications: {
    [key: string]: CNDIApplicationSpec;
  };
  cluster_manifests: {
    [key: string]: unknown;
  };
}

/**
 * CNDIConfig["infrastructure"]
 */

/**
 * CNDIConfig["infrastructure"]["tailscale"] - for bare/k3s deployments
 */
export interface CNDITailscaleConfig {
  tailnet: string; // e.g., "example-platypus.ts.net"
}

export type CNDIInfrastructureSpec = {
  terraform?: TFBlocks;
  cndi: {
    nodes: Array<CNDINodeSpec> | "auto"; // only omitted if distribution is "clusterless"
    tailscale?: CNDITailscaleConfig; // for bare/k3s deployments
    network?: CNDINetworkConfig;
    functions?: CNDIFnsConfig;
    ingress?: CNDIIngressConfig;
    external_dns?: CNDIExternalDNSConfig;
    reloader: {
      enabled?: boolean; // default: true
      values?: Record<string, unknown>;
    };
    cert_manager?:
      & {
        enabled?: boolean; // default: true
        values?: Record<string, unknown>;
      }
      & (
        | { email: string; self_signed?: false } // Email required when self_signed is false or undefined
        | { self_signed: true; email?: never } // Email must not be present when self_signed is true
      );
    microk8s: CNDIMicrok8sConfig;
    argocd: {
      hostname?: string; // auto ingress if set
      install_url?: string;
    };
    open_ports?: Array<CNDIPort>;
    observability?: CNDIObservability;
    keyless: false; // default: false
  };
};

/**
 * CNDIConfig["applications"]
 */
export type ArgoAppInfo = Array<{ name: string; value: string }>;

export type IgnoreDifferencesEntry = {
  group: string;
  kind: string;
  managedFieldsManagers: string[];
  name: string;
  namespace: string;
  jqPathExpressions: string[];
  jsonPointers: string[];
};

export type ApplicationMeta = {
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  finalizers?: string[];
};

export type ApplicationSyncPolicy = {
  automated: {
    prune: boolean;
    selfHeal: boolean;
  };
  syncOptions: string[];
  retry: {
    limit: number;
    backoff: {
      duration: string;
      factor: number;
      maxDuration: string;
    };
  };
};

export interface CNDIApplicationSpec {
  targetRevision: string;
  repoURL: string;
  destinationNamespace: string;
  chart?: string;
  path?: string;
  values: {
    [key: string]: unknown;
  };
  labels?: Record<string, string>;
  finalizers?: string[];
  directory?: {
    include?: string;
    exclude?: string;
  };
  info?: ArgoAppInfo;
  syncPolicy?: ApplicationSyncPolicy;
  metadata?: ApplicationMeta;
  ignoreDifferences?: Array<IgnoreDifferencesEntry>;
  revisionHistoryLimit?: number;
}

/**
 * CNDIConfig["infrastructure"]
 */

/**
 * CNDIConfig["infrastructure"]["terraform"]
 */
type TFBlockVariable = {
  type: "string" | "number" | "bool" | "list" | "map";
  description?: string;
  sensitive?: boolean;
};

export type TFBlocks = {
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

/*
 * CNDIConfig["infrastructure"]["cndi"]
 */

/*
 * CNDIConfig["infrastructure"]["cndi"]["network"]
 */

interface CNDINetworkConfigBase {
  mode: "create" | "insert";
}

type AvailabilityZoneCount = number;
type AvailabilityZoneName = string;

type AvailabilityZoneSpec = AvailabilityZoneCount | AvailabilityZoneName[];

type CreateModeSubnetAutomaticSpec = never;

type AddressSpaceString = string;
type SubnetIdentifierString = string;

type CreateModeSubnetBareArraySpec = {
  public: Array<AddressSpaceString>;
  private: Array<AddressSpaceString>;
};

export interface CNDINetworkConfigCreate extends CNDINetworkConfigBase {
  mode: "create";

  network_address_space?: AddressSpaceString;
  availability_zones?: AvailabilityZoneSpec;
  subnet_address_spaces?:
    | CreateModeSubnetBareArraySpec
    | CreateModeSubnetAutomaticSpec;

  network_identifier?: never;
}

export interface CNDINetworkConfigInsert extends CNDINetworkConfigBase {
  mode: "insert";

  network_identifier: string;

  subnet_identifiers?: {
    public?: Array<SubnetIdentifierString>;
    private?: Array<SubnetIdentifierString>;
  };

  // Alternative to subnet_identifiers, for compatibility with src/types.ts
  subnets?: Array<SubnetIdentifierString>;

  network_address_space?: never;
  availability_zones?: never;
}

export type CNDINetworkConfig =
  | ({ mode: "create" } & CNDINetworkConfigCreate)
  | ({ mode: "insert" } & CNDINetworkConfigInsert);

/*
 * CNDIConfig["infrastructure"]["cndi"]["nodes"]
 */
interface Label {
  [key: string]: string;
}

export type CNDITaintEffect = typeof EFFECT_VALUES[number];

interface Taint {
  key: string;
  value: string;
  effect: CNDITaintEffect;
}

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

export type ManagedNodeKind = typeof MANAGED_NODE_KINDS[number];

export const NODE_ROLE = {
  leader: "leader",
  controller: "controller",
  worker: "worker",
} as const;

// NodeRole refers to the role of the node, e.g. leader, controller.. worker in the future?
export type NodeRole = ObjectValues<typeof NODE_ROLE>;

// NodeKind refers to the type of node, e.g. AWS EC2, GCP CE, etc.
export type NodeKind = ObjectValues<typeof NODE_KIND>;

// cndi_config.jsonc["infrastructure"]["cndi"]["nodes"]["*"]
export interface CNDINodeSpec {
  name: string;
  role?: NodeRole; // default: controller
  labels?: Label;
  taints?: Taint[];
  count?: number; // default: 1
  min_count?: number;
  max_count?: number;

  volume_size?: number;
  size?: number | string; // number: 500 or string: az machine type
  vm_size?: string; // az machine type
  instance_type?: string;
  machine_type?: string;

  disk_size_gb?: number;
  disk_size?: number;
  disk_type?: string;

  // Adding missing properties from schema
  memory?: number | string; // If number, assumed to be in G
  disk?: number | string; // If number, assumed to be in G
  cpus?: number; // For dev/multipass nodes

  // For bare/k3s deployments
  host?: string; // MagicDNS address or 100.x.x.x IPv4 address
  tag?: string; // Tailscale tag for node selection
}

export interface MultipassNodeItemSpec extends CNDINodeSpec {
  name: string;
  cpus?: number;
  memory?: number | string; // if integer, assume G
  disk?: number | string; // if integer, assume G
  disk_size_gb?: number;
  volume_size?: number;
  disk_size?: number;
}

/**
 * CNDIConfig["infrastructure"]["cndi"]["functions"]
 */
export type CNDIFnsConfig = {
  hostname?: string;
  noModuleCache?: boolean;
  maxMemoryLimitMb?: number;
  cpuTimeHardLimitMs?: number;
  cpuTimeSoftLimitMs?: number;
  workerTimeoutMs?: number;
  edgeRuntimeImageTag?: string;
};

/**
 * CNDIConfig["infrastructure"]["cndi"]["microk8s"]
 */
type CNDIMicrok8sConfig = {
  addons: Array<Microk8sAddon>;
  version?: string; // 1.27
  channel?: string; // stable
  "cloud-init": {
    leader_before: Array<string>; //
    leader_after: Array<string>;
  };
};

export type Microk8sAddon = {
  name: string;
  enabled?: boolean;
  args?: string[];
};

/**
 * CNDIConfig["infrastructure"]["cndi"]["ingress"]
 */
export type CNDIIngressConfig = {
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

/**
 * CNDIConfig["infrastructure"]["cndi"]["external_dns"]
 */

type CNDIExternalDNSConfig = {
  enabled?: boolean; // default: true
  provider: ExternalDNSProvider;
  domain_filters: Array<string>;
  values?: Record<string, unknown>;
};

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

/**
 * CNDIConfig["infrastructure"]["cndi"]["open_ports"]
 */
export interface CNDIPort {
  name: string;
  service?: string;
  namespace?: string;
  number: number;
  disable?: boolean;
  private?: boolean;
}

/**
 * CNDIConfig["infrastructure"]["cndi"]["observability"]
 */

export type CNDIObservability = {
  enabled: boolean;
  mode?: "in_cluster"; // Added mode property to match schema
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
