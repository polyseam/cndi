import {
  getPrettyJSONString,
  getTFResource,
  getUserDataTemplateFileString,
} from "src/utils.ts";

export default function getMultipassLocalSensitiveFileTFJSON(): string {
  const resource = getTFResource("local_sensitive_file", {
    content: getUserDataTemplateFileString("leader"),
    filename: "microk8s-cloud-init-leader-hardcoded-values.yml.tftpl",
  });

  return getPrettyJSONString(resource);
}
