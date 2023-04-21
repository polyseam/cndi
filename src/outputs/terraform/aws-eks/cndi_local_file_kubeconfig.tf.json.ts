import { getPrettyJSONString, getTFResource } from "src/utils.ts";
export default function getLocalFileTFJSON(): string {
  const resource = getTFResource("local_file", {
    content: "${data.template_file.kubeconfig.rendered}",
    filename: "${path.module}/.kube/config",
  }, "cndi_local_file_kubeconfig");
  return getPrettyJSONString(resource);
}
