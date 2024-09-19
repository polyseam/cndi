import { YAML } from "deps";

export default function getStorageClassManifestYamlTftpl() {
  const rwmStorageclass = {
    apiVersion: "storage.k8s.io/v1",
    allowVolumeExpansion: true,
    kind: "StorageClass",
    metadata: {
      name: "rwm",
    },
    provisioner: "microk8s.io/hostpath",
    reclaimPolicy: "Delete",
    volumeBindingMode: "Immediate",
  };
  return YAML.stringify(rwmStorageclass).trim();
}
