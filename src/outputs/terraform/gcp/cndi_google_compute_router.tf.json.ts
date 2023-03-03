import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPComputeRouterTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      google_compute_router: {
        cndi_router: {
          name: "cndi-router",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
        },
      },
    },
  });
}
