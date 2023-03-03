import { getPrettyJSONString } from "src/utils.ts";
import { GCPNodeItemSpec } from "src/types.ts";

export default function getGCPComputeInstanceGroupTFJSON(
  nodes: Array<GCPNodeItemSpec>
): string {
    
  const instances = nodes.map((node) => {
    return `\${google_compute_instance.${node.name}.self_link}`;
  });

  return getPrettyJSONString({
    resource: {
      google_compute_instance_group: {
        cndi_google_compute_instance_group: {
          description: "group of instances that form a cndi cluster",
          instances,
          name: "cndi-cluster",
          named_port: [
            {
              name: "http",
              port: "80",
            },
            {
              name: "https",
              port: "443",
            },
          ],
          zone: "${local.zone}",
        },
      },
    },
  });
}
