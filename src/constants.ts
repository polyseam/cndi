export const TERRAFORM_VERSION = "1.4.6";
export const KUBESEAL_VERSION = "0.21.0";
export const DEFAULT_MICROK8S_VERSION = "1.27";

export const DEFAULT_INSTANCE_TYPES = {
  aws: "m5a.large" as const,
  gcp: "n2-standard-2" as const,
  azure: "Standard_D4s_v3" as const,
};

export const DEFAULT_NODE_DISK_SIZE = 100;

export const NODE_DISK_SIZE_KEY = {
  aws: "volume_size" as const,
  gcp: "size" as const,
  azure: "disk_size_gb" as const,
};

export const nonMicrok8sNodeKinds = ["eks"];
export const MICROK8S_INSTALL_RETRY_INTERVAL = 180; // seconds
