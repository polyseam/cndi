// Terraform and Kubeseal CLI versions displayed in --version output
// (installed by manually adding binaries to ./dist/$OS/in with binaries)
const TERRAFORM_VERSION = "1.5.5"; // last version of terraform that was Apache 2.0 licensed
const KUBESEAL_VERSION = "0.26.0";

// NON-HELM INSTALL VERSION, prev. used in microk8s cloudinit
const ARGOCD_RELEASE_VERSION = "2.11.2";

// Multipass Terraform Provider Version used by dev/microk8s
const LARSTOBI_MULTIPASS_PROVIDER_VERSION = "1.4.2";

// Edge Runtime that powers CNDI Functions
const EDGE_RUNTIME_IMAGE_TAG = "1.66.1";

// used in terraform output to create clusters
const DEFAULT_K8S_VERSION = "1.28";

// Root Application Chart Versions (terraform managed)
const ARGOCD_CHART_VERSION = "7.7.10";
const SEALED_SECRETS_CHART_VERSION = "2.15.0";

// Core Application Chart Versions (gitops managed)
const CERT_MANAGER_CHART_VERSION = "1.14.3";
const RELOADER_CHART_VERSION = "1.0.69";
const NGINX_CHART_VERSION = "4.8.3";
const EXTERNAL_DNS_CHART_VERSION = "6.35.0";
const KUBE_PROMETHEUS_STACK_CHART_VERSION = "67.4.0";
const PROMTAIL_CHART_VERSION = "6.16.6";
const LOKI_CHART_VERSION = "6.24.0";

// Polyseam-built CNDI Templates live here (./templates)
const POLYSEAM_TEMPLATE_DIRECTORY_URL =
  "https://raw.githubusercontent.com/polyseam/cndi/main/templates/";

const DEFAULT_INSTANCE_TYPES = {
  aws: "t3.large" as const,
  gcp: "n2-standard-2" as const,
  azure: "Standard_D2s_v3" as const,
};

const DEFAULT_NODE_DISK_SIZE_UNMANAGED = 100; // GB
const DEFAULT_NODE_DISK_SIZE_MANAGED = 30; // GB

const NODE_DISK_SIZE_KEY = {
  aws: "volume_size" as const,
  gcp: "size" as const,
  azure: "disk_size_gb" as const,
};

const MANAGED_NODE_KINDS = ["eks", "gke", "aks"] as const;

const CLOUDINIT_RETRY_INTERVAL = 90; // seconds

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

export const DEFAULT_VNET_ADDRESS_SPACE = "10.0.0.0/16";
export const DEFAULT_SUBNET_ADDRESS_SPACE = "10.0.0.0/20";

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
    name: "kafka",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/kafka.yaml`,
  },
  {
    name: "wordpress",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/wordpress.yaml`,
  },
  {
    name: "gpu-operator",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/gpu-operator.yaml`,
  },
  {
    name: "vllm",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/vllm.yaml`,
  },
  {
    name: "fns",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/fns.yaml`,
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
  {
    name: "mongodb",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/mongodb.yaml`,
  },
  {
    name: "redis",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/redis.yaml`,
  },
  {
    name: "minio",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/minio.yaml`,
  },
  {
    name: "superset",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/superset.yaml`,
  },
] as const;

export const NO_SCHEDULE = "NoSchedule" as const;
export const PREFER_NO_SCHEDULE = "PreferNoSchedule" as const;
export const NO_EXECUTE = "NoExecute" as const;

export const EFFECT_VALUES = [
  NO_SCHEDULE,
  PREFER_NO_SCHEDULE,
  NO_EXECUTE,
] as const;

export {
  ARGOCD_CHART_VERSION,
  ARGOCD_RELEASE_VERSION,
  CERT_MANAGER_CHART_VERSION,
  CLOUDINIT_RETRY_INTERVAL,
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_K8S_VERSION,
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  DEFAULT_NODE_DISK_SIZE_UNMANAGED,
  DEFAULT_OPEN_PORTS,
  EDGE_RUNTIME_IMAGE_TAG,
  EXTERNAL_DNS_CHART_VERSION,
  KNOWN_TEMPLATES,
  KUBE_PROMETHEUS_STACK_CHART_VERSION,
  KUBESEAL_VERSION,
  LARSTOBI_MULTIPASS_PROVIDER_VERSION,
  LOKI_CHART_VERSION,
  MANAGED_NODE_KINDS,
  NGINX_CHART_VERSION,
  NODE_DISK_SIZE_KEY,
  POLYSEAM_TEMPLATE_DIRECTORY_URL,
  PROCESS_ERROR_CODE_PREFIX,
  PROMTAIL_CHART_VERSION,
  RELOADER_CHART_VERSION,
  SEALED_SECRETS_CHART_VERSION,
  TERRAFORM_VERSION,
};
