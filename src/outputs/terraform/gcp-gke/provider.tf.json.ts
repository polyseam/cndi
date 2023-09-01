import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPComputeEngineProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: [
      {
        google: {
          project: "${local.project_id}",
          region: "${local.gcp_region}",
          zone: "${local.gcp_region}-a",
        },
      },
      {
        kubectl: {
          apply_retry_count: 5,
          cluster_ca_certificate:
            "${base64decode(module.cndi_gke_cluster.ca_certificate)}",
          host: "https://${module.cndi_gke_cluster.endpoint}",
          token:
            "${data.google_client_config.cndi_google_client_config.access_token}",
        },
      },
      {
        helm: {
          kubernetes: {
            cluster_ca_certificate:
              "${base64decode(module.cndi_gke_cluster.ca_certificate)}",
            host: "https://${module.cndi_gke_cluster.endpoint}",
            token:
              "${data.google_client_config.cndi_google_client_config.access_token}",
          },
        },
      },
      {
        kubernetes: {
          cluster_ca_certificate:
            "${base64decode(module.cndi_gke_cluster.ca_certificate)}",
          host: "https://${module.cndi_gke_cluster.endpoint}",
          token:
            "${data.google_client_config.cndi_google_client_config.access_token}",
        },
      },
      { time: {} },
      { bcrypt: {} },
    ],
  });
}
