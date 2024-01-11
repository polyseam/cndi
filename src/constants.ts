const TERRAFORM_VERSION = "1.5.5";
const KUBESEAL_VERSION = "0.21.0"; // used to install binary on client
const SEALED_SECRETS_VERSION = "2.13.3"; // used to install controller on cluster
const DEFAULT_MICROK8S_VERSION = "1.28";
const ARGOCD_VERSION = "2.7.12";
const RELOADER_VERSION = "1.0.52";
const LARSTOBI_MULTIPASS_PROVIDER_VERSION = "1.4.2";
const EXTERNAL_DNS_VERSION = "6.29.1";

const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/main/templates/";

const DEFAULT_INSTANCE_TYPES = {
  aws: "t3.large" as const,
  gcp: "n2-standard-2" as const,
  azure: "Standard_D2s_v3" as const,
};

const DEFAULT_NODE_DISK_SIZE_UNMANAGED = 100;
const DEFAULT_NODE_DISK_SIZE_MANAGED = 30;

const NODE_DISK_SIZE_KEY = {
  aws: "volume_size" as const,
  gcp: "size" as const,
  azure: "disk_size_gb" as const,
};

const MANAGED_NODE_KINDS = ["eks", "gke", "aks"] as const;

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
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  DEFAULT_NODE_DISK_SIZE_UNMANAGED,
  DEFAULT_OPEN_PORTS,
  EXTERNAL_DNS_VERSION,
  KUBESEAL_VERSION,
  LARSTOBI_MULTIPASS_PROVIDER_VERSION,
  MANAGED_NODE_KINDS,
  MICROK8S_INSTALL_RETRY_INTERVAL,
  NODE_DISK_SIZE_KEY,
  POLYSEAM_TEMPLATE_DIRECTORY,
  RELOADER_VERSION,
  SEALED_SECRETS_VERSION,
  TERRAFORM_VERSION,
};
