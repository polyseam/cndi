import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import type { KubernetesStorageClass } from "src/outputs/terraform/shared/resource/KubernetesStorageClass.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const kubernetes_storage_class: Record<string, KubernetesStorageClass> = {
    cndi_kubernetes_storage_class_rwo: {
      storage_provisioner: "disk.csi.azure.com",
      allow_volume_expansion: true,
      metadata: {
        annotations: {
          "storageclass.kubernetes.io/is-default-class": "true",
        },
        name: "rwo",
      },
      parameters: {
        skuName: "Standard_LRS",
      },
      reclaim_policy: "Delete",
      volume_binding_mode: "WaitForFirstConsumer",
    },

    cndi_kubernetes_storage_class_rwm: {
      storage_provisioner: "file.csi.azure.com",
      allow_volume_expansion: true,
      metadata: {
        name: "rwm",
      },
      parameters: {
        skuName: "Standard_LRS",
      },
      mount_options: [
        "mfsymlinks",
        "actimeo=30",
        "nosharesock",
      ],
      reclaim_policy: "Delete",
      volume_binding_mode: "WaitForFirstConsumer",
    },
  };
  return getPrettyJSONString({
    resource: {
      kubernetes_storage_class,
    },
  });
}
