import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
  const resource = {
    kubernetes_storage_class: {
      cndi_kubernetes_storage_class_ebs: {
        allow_volume_expansion: true,
        metadata: {
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true",
          },
          name: "rwo",
        },
        parameters: {
          fsType: "ext4",
          type: "gp3",
        },
        reclaim_policy: "Delete",
        storage_provisioner: "ebs.csi.azure.com",
        volume_binding_mode: "WaitForFirstConsumer",
      },
      cndi_kubernetes_storage_class_efs: {
        allow_volume_expansion: true,
        metadata: {
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "false",
          },
          name: "rwm",
        },
        parameters: {
          directoryPerms: "700",
          fileSystemId:
            "${azure_efs_file_system.cndi_azure_efs_file_system.id}",
          gidRangeEnd: "2000",
          gidRangeStart: "1000",
          provisioningMode: "efs-ap",
        },
        reclaim_policy: "Delete",
        storage_provisioner: "efs.csi.azure.com",
        volume_binding_mode: "WaitForFirstConsumer",
      },
    },
  };
  return getPrettyJSONString({ resource });
}
