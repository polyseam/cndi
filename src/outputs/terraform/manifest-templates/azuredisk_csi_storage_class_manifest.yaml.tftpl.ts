export default function getStorageClassManifestYamlTftpl() {
  return `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: cndi-managed-premium-v2-disk
  annotations:
    storageclass.kubernetes.io/is-default-class: 'true'
provisioner: disk.csi.azure.com
parameters:
  skuName: PremiumV2_LRS
  fsType: xfs
  enableBursting: "true"
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
`.trim();
}
