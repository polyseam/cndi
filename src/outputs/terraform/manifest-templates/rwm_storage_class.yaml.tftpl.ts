import { YAML } from "deps";

export default function getStorageClassManifestYamlTftpl() {
    const rwmStorageclass = {
        apiVersion: "storage.k8s.io/v1",
        allowVolumeExpansion: true,
        kind: "StorageClass",
        metadata: {
            name: "rwm",
            annotations: {
                "storageclass.kubernetes.io/is-default-class": "false",
            },
        },
        provisioner: "cluster.local/nfs-server-provisioner",
        reclaimPolicy: "Delete",
        volumeBindingMode: "Immediate",
    };
    return YAML.stringify(rwmStorageclass).trim();
}
