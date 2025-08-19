import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

const _label = ccolors.faded("\nsrc/outputs/terraform/provider.tf.json.ts:\n");

const KUBERNETES_PROVIDER_CONFIG = {
  aws: {
    cluster_ca_certificate:
      "${base64decode(module.cndi_aws_eks_module.cluster_certificate_authority_data)}",
    exec: {
      api_version: "client.authentication.k8s.io/v1beta1",
      args: [
        "eks",
        "get-token",
        "--cluster-name",
        "${module.cndi_aws_eks_module.cluster_name}",
      ],
      command: "aws",
    },
    host: "${module.cndi_aws_eks_module.cluster_endpoint}",
  },
  azure: {
    host: "${module.cndi_azurerm_aks_module.host}",
    client_certificate:
      "${base64decode(module.cndi_azurerm_aks_module.client_certificate)}",
    client_key: "${base64decode(module.cndi_azurerm_aks_module.client_key)}",
    cluster_ca_certificate:
      "${base64decode(module.cndi_azurerm_aks_module.cluster_ca_certificate)}",
  },
  gcp: {
    host: "https://${module.cndi_gcp_gke_module.endpoint}",
    token:
      "${data.google_client_config.cndi_google_client_config.access_token}",
    cluster_ca_certificate:
      "${base64decode(module.cndi_gcp_gke_module.ca_certificate)}",
  },
  bare: {
    tailscale: {},
    null: {},
    local: {},
    kubernetes: {
      host: "${local.k3s_cluster_endpoint}",
      cluster_ca_certificate:
        "${base64decode(local.k3s_cluster_ca_certificate)}",
      token: "${local.k3s_cluster_token}",
    },
    helm: {
      kubernetes: {
        host: "${local.k3s_cluster_endpoint}",
        cluster_ca_certificate:
          "${base64decode(local.k3s_cluster_ca_certificate)}",
        token: "${local.k3s_cluster_token}",
      },
    },
  },
  dev: {}, // TODO: actually solve
};

export default function getProviderTfJSON(
  { provider }: NormalizedCNDIConfig,
): string {
  const kubernetes = KUBERNETES_PROVIDER_CONFIG[provider];

  const out: Record<string, Array<unknown>> = {
    helm: [{
      kubernetes,
    }],
    kubernetes: [kubernetes],
    time: [{}],
    tls: [{}],
  };

  // AWS wants the exec command in an array, helm wants it in an object
  if ("exec" in kubernetes) {
    out.kubernetes = [{
      ...kubernetes,
      exec: [kubernetes.exec],
    }];
  }

  switch (provider) {
    case "aws":
      out.aws = [{
        default_tags: [{
          tags: {
            CNDIProject: "${local.cndi_project_name}",
            CNDIVersion: "v2",
          },
        }],
        region: "${local.region}",
      }];
      break;
    case "gcp":
      out.google = [{
        project: "${local.cndi_gcp_project_id}",
        region: "${local.region}",
      }];
      break;
    case "azure":
      out.azurerm = [{
        features: [{}],
      }];
      break;
    case "bare":
      out.bare = [{}];
      break;
    case "dev":
      out.multipass = [{}];
      out.local = [{}];
      out.random = [{}];
      delete out.kubernetes;
      delete out.helm;
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
  // TODO: some variables are not used in every stack
  return getPrettyJSONString({ provider: out });
}
