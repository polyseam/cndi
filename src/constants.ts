const TERRAFORM_VERSION = "1.5.5";
const KUBESEAL_VERSION = "0.26.0"; // used to install binary on client
const SEALED_SECRETS_VERSION = "2.15.0"; // used to install controller on cluster
const DEFAULT_K8S_VERSION = "1.28";
const ARGOCD_VERSION = "2.10.1";
const RELOADER_VERSION = "1.0.69";
const LARSTOBI_MULTIPASS_PROVIDER_VERSION = "1.4.2";
const EXTERNAL_DNS_VERSION = "6.35.0";
const CERT_MANAGER_VERSION = "1.14.3";
const NGINX_VERSION = "4.8.3";

const POLYSEAM_TEMPLATE_DIRECTORY_URL =
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

const CLOUDINIT_RETRY_INTERVAL = 180; // seconds

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

export { default as error_code_reference } from "../docs/error-code-reference.json" with { type: "json" };

const PROCESS_ERROR_CODE_PREFIX = {
  terraform: 1000,
  kubeseal: 2000,
  "ssh-keygen": 3000,
} as const;

// better to have a defined list of builtin templates than walk /templates directory
const KNOWN_TEMPLATES = [
  {
    name: "basic",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/basic.yaml`,
  },
  {
    name: "airflow",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/airflow.yaml`,
  },
  {
    name: "cnpg",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/cnpg.yaml`,
  },
  {
    name: "neo4j",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/neo4j.yaml`,
  },
  {
    name: "proxy",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/proxy.yaml`,
  },
  {
    name: "mssqlserver",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/mssqlserver.yaml`,
  },
] as const;

export {
  ARGOCD_VERSION,
  CERT_MANAGER_VERSION,
  CLOUDINIT_RETRY_INTERVAL,
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_K8S_VERSION,
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  DEFAULT_NODE_DISK_SIZE_UNMANAGED,
  DEFAULT_OPEN_PORTS,
  EXTERNAL_DNS_VERSION,
  KNOWN_TEMPLATES,
  KUBESEAL_VERSION,
  LARSTOBI_MULTIPASS_PROVIDER_VERSION,
  MANAGED_NODE_KINDS,
  NGINX_VERSION,
  NODE_DISK_SIZE_KEY,
  POLYSEAM_TEMPLATE_DIRECTORY_URL,
  PROCESS_ERROR_CODE_PREFIX,
  RELOADER_VERSION,
  SEALED_SECRETS_VERSION,
  TERRAFORM_VERSION,
};
