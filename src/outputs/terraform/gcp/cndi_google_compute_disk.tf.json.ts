import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { GCPNodeItemSpec } from "src/types.ts";
import { DEFAULT_NODE_DISK_SIZE } from "constants";

export default function getGCPComputeInstanceTFJSON(
  node: GCPNodeItemSpec,
): string {
  const { name } = node;
  const DEFAULT_IMAGE = "ubuntu-2004-focal-v20221121"; // The image from which to initialize this disk
  const image = node?.image || DEFAULT_IMAGE;
  const size = node?.size || node?.volume_size || DEFAULT_NODE_DISK_SIZE;
  const type = "pd-ssd"; //  The GCE disk type. Such as pd-standard, pd-balanced or pd-ssd.

  const resource = getTFResource(
    "google_compute_disk",
    {
      name: `cndi-compute-disk-${name}`,
      image,
      size,
      type,
      depends_on: [
        "google_project_service.cndi_google_project_service_compute",
      ],
    },
    `cndi_google_compute_disk_${node.name}`,
  ).resource;

  return getPrettyJSONString({
    resource,
  });
}
