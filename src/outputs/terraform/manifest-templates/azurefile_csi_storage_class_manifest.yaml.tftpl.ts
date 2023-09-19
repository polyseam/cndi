export default function getStorageClassManifestYamlTftpl() {
  return `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs
provisioner: file.csi.azure.com
parameters:
  skuName: Premium_LRS
  protocol: nfs
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
`.trim();
}
