// Terraform and Kubeseal CLI versions displayed in --version output
// (installed by manually adding binaries to ./dist/$OS/in with binaries)
export const TERRAFORM_VERSION = "1.5.5"; // last version of terraform that was Apache 2.0 licensed
export const KUBESEAL_VERSION = "0.26.0";

// NON-HELM INSTALL VERSION, prev. used in microk8s cloudinit
export const ARGOCD_RELEASE_VERSION = "2.11.2";

// Multipass Terraform Provider Version used by dev/microk8s
export const LARSTOBI_MULTIPASS_PROVIDER_VERSION = "1.4.2";

// Edge Runtime that powers CNDI Functions
export const EDGE_RUNTIME_IMAGE_TAG = "1.62.2";

// used in terraform output to create clusters
export const DEFAULT_K8S_VERSION = "1.31";

// Root Application Chart Versions (terraform managed)
export const ARGOCD_CHART_VERSION = "7.7.10";
export const SEALED_SECRETS_CHART_VERSION = "2.15.0";

// Core Application Chart Versions (gitops managed)
export const CERT_MANAGER_CHART_VERSION = "1.14.3";
export const RELOADER_CHART_VERSION = "1.0.69";
export const NGINX_CHART_VERSION = "4.8.3";
export const EXTERNAL_DNS_CHART_VERSION = "6.35.0";
export const KUBE_PROMETHEUS_STACK_CHART_VERSION = "67.4.0";
export const PROMTAIL_CHART_VERSION = "6.16.6";
export const LOKI_CHART_VERSION = "6.24.0";
