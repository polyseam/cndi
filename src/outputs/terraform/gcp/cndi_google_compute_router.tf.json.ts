import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeRouterTFJSON(): string {
  const resource = getTFResource("google_compute_router", {
    name: "cndi-router",
    network: "${google_compute_network.cndi_vpc_network.self_link}",
  });
  return getPrettyJSONString(resource);
}
