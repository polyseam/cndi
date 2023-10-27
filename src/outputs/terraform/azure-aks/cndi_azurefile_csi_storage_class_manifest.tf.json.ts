import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureFileManifest(): string {
  const resource = getTFResource("kubectl_manifest", {
    depends_on: ["module.cndi_aks_cluster"],
    yaml_body:
      "${data.template_file.azurefile_csi_storage_class_manifest.rendered}",
  }, "cndi_azurefile_csi_storage_class_manifest");
  return getPrettyJSONString(resource);
}
