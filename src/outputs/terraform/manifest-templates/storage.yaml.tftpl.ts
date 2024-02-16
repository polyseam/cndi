import { YAML } from "deps";

export default function getStorageClassManifestYamlTftpl(
  isDevCluster: boolean,
) {
  const provisioner = isDevCluster
    ? "microk8s.io/hostpath"
    : "cluster.local/nfs-server-provisioner";

  const rootApplication = {
    apiVersion: "storage.k8s.io/v1",
    allowVolumeExpansion: true, // TODO: verify this is acceptable with hostpath-storage
    kind: "StorageClass",
    metadata: {
      name: "rwm",
      annotations: {
        "storageclass.kubernetes.io/is-default-class": "true",
      },
    },
    provisioner,
    reclaimPolicy: "Delete",
    volumeBindingMode: "Immediate",
  };
  return YAML.stringify(rootApplication).trim();
}
