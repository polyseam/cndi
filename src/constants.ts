const TERRAFORM_VERSION = "1.5.5";
const KUBESEAL_VERSION = "0.21.0";
const DEFAULT_MICROK8S_VERSION = "1.27";
const ARGOCD_VERSION = "2.7.12";

const DEFAULT_INSTANCE_TYPES = {
  aws: "t3.large" as const,
  gcp: "n2-standard-2" as const,
  azure: "Standard_D4s_v3" as const,
};

const DEFAULT_NODE_DISK_SIZE = 100;

const NODE_DISK_SIZE_KEY = {
  aws: "volume_size" as const,
  gcp: "size" as const,
  azure: "disk_size_gb" as const,
};

const NON_MICROK8S_NODE_KINDS = ["eks", "gke", "aks"];
const MICROK8S_INSTALL_RETRY_INTERVAL = 180; // seconds

const DEFAULT_OPEN_PORTS = [
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

export { default as error_code_reference } from "../docs/error-code-reference.json" assert { type: "json" };

export {
  ARGOCD_VERSION,
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_MICROK8S_VERSION,
  DEFAULT_NODE_DISK_SIZE,
  DEFAULT_OPEN_PORTS,
  KUBESEAL_VERSION,
  MICROK8S_INSTALL_RETRY_INTERVAL,
  NODE_DISK_SIZE_KEY,
  NON_MICROK8S_NODE_KINDS,
  TERRAFORM_VERSION,
};
