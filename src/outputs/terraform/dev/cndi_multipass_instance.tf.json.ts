import { getPrettyJSONString, getTFResource } from "src/utils.ts";

import { MultipassNodeItemSpec } from "src/types.ts";

export default function getMultipassInstanceTFJSON(
  node: MultipassNodeItemSpec,
): string {
  const { name } = node;
  const DEFAULT_DEV_DISK_SIZE = 50;
  const suffix = "GiB";
  const cpus = 4;
  const size = node?.volume_size || node?.disk_size || node?.disk_size_gb ||
    DEFAULT_DEV_DISK_SIZE;
  const ram = 4;
  const disk = `${size}${suffix}`;
  const memory = `${ram}${suffix}`;
  const resource = getTFResource("multipass_instance", {
    name,
    cloudinit_file: "microk8s-cloud-init-leader-hardcoded-values.yml.tftpl",
    cpus,
    disk,
    memory,
    depends_on: ["local_sensitive_file.cndi_local_sensitive_file"],
  });

  return getPrettyJSONString(resource);
}
