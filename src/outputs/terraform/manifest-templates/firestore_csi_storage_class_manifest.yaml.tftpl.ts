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
  network: '\${vpc_id}'
  connect-mode: PRIVATE_SERVICE_ACCESS
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
`.trim();
}
