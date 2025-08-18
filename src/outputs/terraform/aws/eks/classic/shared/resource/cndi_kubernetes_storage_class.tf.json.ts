import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import type { KubernetesStorageClass } from "src/outputs/terraform/shared/resource/KubernetesStorageClass.ts";

export default function (cndi_config: NormalizedCNDIConfig) {
  const ebsStorageProvisioner = cndi_config.infrastructure.cndi.nodes === "auto"
    ? "ebs.csi.eks.amazonaws.com"
    : "ebs.csi.aws.com";

  const kubernetes_storage_class: Record<string, KubernetesStorageClass> = {
    cndi_kubernetes_storage_class_rwo: {
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
      storage_provisioner: ebsStorageProvisioner,
      volume_binding_mode: "WaitForFirstConsumer",
    },
    cndi_kubernetes_storage_class_rwm: {
      allow_volume_expansion: true,
      metadata: {
        annotations: {
          "storageclass.kubernetes.io/is-default-class": "false",
        },
        name: "rwm",
      },
      parameters: {
        directoryPerms: "700",
        fileSystemId: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
        gidRangeEnd: "2000",
        gidRangeStart: "1000",
        provisioningMode: "efs-ap",
      },
      reclaim_policy: "Delete",
      storage_provisioner: "efs.csi.aws.com",
      volume_binding_mode: "WaitForFirstConsumer",
    },
  };
  return getPrettyJSONString({
    resource: {
      kubernetes_storage_class,
    },
  });
}
