export default function getStorageClassManifestYamlTftpl() {
  return `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: azurefile-csi
annotations:
  storageclass.kubernetes.io/is-default-class: 'true'
provisioner: file.csi.azure.com
parameters:
  type: Standard_LRS
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: Immediate
`.trim();
}
