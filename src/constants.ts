export const DEFAULT_INSTANCE_TYPES = {
  aws: "t3.large" as const,
  gcp: "n2-standard-2" as const,
  azure: "Standard_D2s_v3" as const,
};

export const DEFAULT_NODE_DISK_SIZE_UNMANAGED = 100; // GB
export const DEFAULT_NODE_DISK_SIZE_MANAGED = 30; // GB

export const NODE_DISK_SIZE_KEY = {
  aws: "volume_size" as const,
  gcp: "size" as const,
  azure: "disk_size_gb" as const,
};

export const MANAGED_NODE_KINDS = ["eks", "gke", "aks"] as const;

export const CLOUDINIT_RETRY_INTERVAL = 90; // seconds

export const DEFAULT_OPEN_PORTS = [
  {
    name: "http",
    number: 80,
  },
  {
    name: "https",
    number: 443,
  },
  {
    name: "ssh",
    number: 22,
  },
] as const;

export const DEFAULT_VNET_ADDRESS_SPACE = "10.0.0.0/16";
export const DEFAULT_SUBNET_ADDRESS_SPACE = "10.0.0.0/20";

export { default as error_code_reference } from "../docs/error-code-reference.json" with { type: "json" };

export const PROCESS_ERROR_CODE_PREFIX = {
  terraform: 1000,
  kubeseal: 2000,
  "ssh-keygen": 3000,
} as const;

export const NO_SCHEDULE = "NoSchedule" as const;
export const PREFER_NO_SCHEDULE = "PreferNoSchedule" as const;
export const NO_EXECUTE = "NoExecute" as const;

export const EFFECT_VALUES = [
  NO_SCHEDULE,
  PREFER_NO_SCHEDULE,
  NO_EXECUTE,
] as const;
