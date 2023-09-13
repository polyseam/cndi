export default function getStorageClassManifestYamlTftpl() {
  return `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs
  annotations:
    storageclass.kubernetes.io/is-default-class: 'true'
provisioner: filestore.csi.storage.gke.io
parameters:
  tier: standard
  network: default
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: Immediate
`.trim();
}
