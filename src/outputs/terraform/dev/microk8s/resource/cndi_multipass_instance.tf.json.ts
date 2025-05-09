import { CNDIConfig, MultipassNodeItemSpec } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";
import {
  cndi_cloud_init_filename,
  cndi_cloud_init_name,
} from "./cndi_local_sensitive_file.tf.json.ts";

const _label = ccolors.faded(
  "src/outputs/terraform/dev/microk8s/cndi_multipass_instance.tf.json.ts:",
);

const isValidMultipassCapacityString = (str: string): boolean => {
  const suffix = str.slice(-1);
  const number = str.slice(0, -1);

  if (suffix === "G" || suffix === "M" || suffix === "K") {
    return !Number.isNaN(parseInt(number));
  }
  return false;
};

export default function (cndi_config: CNDIConfig) {
  const [node] = cndi_config.infrastructure.cndi
    .nodes as MultipassNodeItemSpec[];

  const { name } = node;
  const DEFAULT_DISK_SIZE = 128;
  const DEFAULT_CPUS = 4;
  const DEFAULT_MEMORY = 4;
  const suffix = "G";
  const cpus = node?.cpus || DEFAULT_CPUS;

  const userSpecifiedMemory = !!node?.memory;
  const userMemoryIsInt = !isNaN(Number(node?.memory!));

  let memory = `${DEFAULT_MEMORY}${suffix}`; // 4G

  if (userSpecifiedMemory) {
    if (userMemoryIsInt) {
      memory = `${node.memory}${suffix}`; // assume G
    } else {
      if (isValidMultipassCapacityString(`${node.memory!}`)) {
        memory = `${node.memory!}`; // eg. 500G | 5000M | 100000K
      } else {
        // TODO: fail validation here?
        console.error(
          ccolors.warn(`Invalid multipass node memory value:`),
          ccolors.user_input(`"${node.memory!}"`),
        );
      }
    }
  }

  let disk = `${DEFAULT_DISK_SIZE}${suffix}`; // 128G

  const userSpecifiedDisk = !!node?.disk;
  const userDiskIsInt = !isNaN(Number(node?.disk!));

  if (userSpecifiedDisk) {
    if (userDiskIsInt) {
      disk = `${node.disk}${suffix}`;
    } else {
      if (isValidMultipassCapacityString(`${node.disk!}`)) {
        disk = `${node.disk!}`;
      } else {
        // TODO: fail validation here?
        console.warn(
          ccolors.warn(`Invalid multipass node disk value:`),
          ccolors.user_input(`"${node.disk!}"`),
        );
      }
    }
  }
  const resource = {
    multipass_instance: {
      cndi_multipass_instance: {
        name,
        cloudinit_file: cndi_cloud_init_filename,
        memory,
        cpus,
        disk,
        depends_on: [`\${local_sensitive_file.${cndi_cloud_init_name}}`],
      },
    },
  };
  return getPrettyJSONString({ resource });
}
