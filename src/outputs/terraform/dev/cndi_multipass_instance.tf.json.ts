import {
  getPrettyJSONString,
  getTFResource,
  getUserDataTemplateFileString,
} from "src/utils.ts";

type MultipassInstanceItemSpec = {
  name: string;
  cpus?: number;
  disk?: string;
  memory?: string;
};

export default function getMultipassInstanceTFJSON(
  { name, cpus = 4, disk = "50GiB", memory = "4GiB" }:
    MultipassInstanceItemSpec,
): string {
  const resource = getTFResource("multipass_instance", {
    name,
    cloudinit_file: getUserDataTemplateFileString("leader"),
    cpus,
    disk,
    memory,
  });

  return getPrettyJSONString(resource);
}
