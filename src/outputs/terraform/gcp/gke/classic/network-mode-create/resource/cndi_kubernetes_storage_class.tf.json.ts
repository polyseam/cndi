import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import type { KubernetesStorageClass } from "src/outputs/terraform/shared/resource/KubernetesStorageClass.ts";

export default function (_cndi_config: CNDIConfig) {
  const kubernetes_storage_class: Record<string, KubernetesStorageClass> = {
    cndi_kubernetes_storage_class_rwo: {
      storage_provisioner: "pd.csi.storage.gke.io",
      allow_volume_expansion: true,
      metadata: {
        annotations: {
          "storageclass.kubernetes.io/is-default-class": "true",
        },
        name: "rwo",
      },
      parameters: {
        type: "pd-balanced",
      },
      reclaim_policy: "Delete",
      volume_binding_mode: "WaitForFirstConsumer",
      depends_on: ["google_compute_network.cndi_google_compute_network"],
    },
    cndi_kubernetes_storage_class_rwm: {
      storage_provisioner: "filestore.csi.storage.gke.io",
      allow_volume_expansion: true,
      metadata: {
        name: "rwm",
      },
      parameters: {
        network: "${google_compute_network.cndi_google_compute_network.name}",
      },
      reclaim_policy: "Delete",
      volume_binding_mode: "WaitForFirstConsumer",
    },
  };
  return getPrettyJSONString({ resource: kubernetes_storage_class });
}
