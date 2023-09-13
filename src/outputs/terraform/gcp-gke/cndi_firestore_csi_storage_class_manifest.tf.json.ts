import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getfirestoreCsiStorageClassManifestTFJSON(): string {
  const resource = getTFResource("kubectl_manifest", {
    depends_on: ["module.cndi_gke_cluster"],
    yaml_body:
      "${data.template_file.firestore_csi_storage_class_manifest.rendered}",
  }, "cndi_firestore_csi_storage_class_manifest");
  return getPrettyJSONString(resource);
}
