import {
  getPrettyJSONString,
  getTFResource,
  getUserDataTemplateFileString,
} from "src/utils.ts";

export default function getMultipassLocalSensitiveFileTFJSON(): string {
  const resource = getTFResource("local_sensitive_file", {
    // node_hostname is not consumed by multipass so it is empty
    content: getUserDataTemplateFileString({
      role: "leader",
      node_hostname: "",
    }),
    filename: "microk8s-cloud-init-leader-hardcoded-values.yml.tftpl",
  });

  return getPrettyJSONString(
    resource,
  );
}
