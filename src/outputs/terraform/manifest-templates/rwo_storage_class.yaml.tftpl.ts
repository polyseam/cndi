import { YAML } from "deps";

export default function getStorageClassManifestYamlTftpl() {
  const rwoStorageclass = {
    apiVersion: "storage.k8s.io/v1",
    allowVolumeExpansion: true,
    kind: "StorageClass",
    metadata: {
      name: "rwo",
      annotations: {
        "storageclass.kubernetes.io/is-default-class": "true",
      },
    },
    provisioner: "microk8s.io/hostpath",
    reclaimPolicy: "Delete",
    volumeBindingMode: "WaitForFirstConsumer",
  };
  return YAML.stringify(rwoStorageclass).trim();
}
