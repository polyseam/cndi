import { getPrettyJSONString } from "src/utils.ts";

export default function getAzureProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: [
      {
        azurerm: {
          features: {},
          skip_provider_registration: "true",
        },
      },
      {
        helm: {
          kubernetes: {
            "client_certificate":
              "${base64decode(module.cndi_aks_cluster.client_certificate)}",
            "client_key": "${base64decode(module.cndi_aks_cluster.client_key)}",
            "cluster_ca_certificate":
              "${base64decode(module.cndi_aks_cluster.cluster_ca_certificate)}",
            "host": "${module.cndi_aks_cluster.host}",
          },
        },
      },
      {
        kubectl: {
          "apply_retry_count": 5,
          "client_certificate":
            "${base64decode(module.cndi_aks_cluster.client_certificate)}",
          "client_key": "${base64decode(module.cndi_aks_cluster.client_key)}",
          "cluster_ca_certificate":
            "${base64decode(module.cndi_aks_cluster.cluster_ca_certificate)}",
          "host": "${module.cndi_aks_cluster.host}",
          "load_config_file": false,
        },
      },
      {
        time: {},
      },
      {
        bcrypt: {},
      },
    ],
  });
}
