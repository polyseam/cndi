import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

const _label = ccolors.faded("\nsrc/outputs/terraform/provider.tf.json.ts:");

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
    client_certificate:
      "${base64decode(azurerm_kubernetes_cluster.cndi_azurerm_kubernetes_cluster.kube_config[0].client_certificate)}",
    client_key:
      "${base64decode(azurerm_kubernetes_cluster.cndi_azurerm_kubernetes_cluster.kube_config[0].client_key)}",
    cluster_ca_certificate:
      "${base64decode(azurerm_kubernetes_cluster.cndi_azurerm_kubernetes_cluster.kube_config[0].cluster_ca_certificate)}",
    host:
      "${azurerm_kubernetes_cluster.cndi_azurerm_kubernetes_cluster.kube_config[0].host}",
  },
  gcp: {
    cluster_ca_certificate:
      "${base64decode(google_container_cluster.cndi_google_container_cluster.master_auth[0].cluster_ca_certificate)}",
    host:
      "https://${google_container_cluster.cndi_google_container_cluster.endpoint}",
    token:
      "${data.google_client_config.cndi_google_client_config.access_token}",
  },
  dev: {}, // TODO: actually solve
};

export default function getProviderTfJSON(
  { provider }: CNDIConfig,
): string {
  const kubernetes = KUBERNETES_PROVIDER_CONFIG[provider];

  const out: Record<string, Array<unknown>> = {
    helm: [{
      kubernetes,
    }],
    kubernetes: [kubernetes],
    random: [{}],
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
        region: "${local.aws_region}",
      }];
      break;
    case "gcp":
      out.google = [{
        project: "${local.gcp_project}", // TODO: get provider config for gcp from env
        region: "${local.gcp_region}",
        zone: "${local.gcp_zone}",
      }];
      break;
    case "azure":
      out.azurerm = [{
        features: [{}],
      }];
      break;
    case "dev":
      out.multipass = [{}];
      out.local = [{}];
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
  // TODO: some variables are not used in every stack
  return getPrettyJSONString({ provider: out });
}
