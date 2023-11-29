import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeNetworkTFJSON(): string {
  const resource = getTFResource("google_compute_network", {
    auto_create_subnetworks: false,
    name: "cndi-vpc-network",
    depends_on: ["google_project_service.cndi_google_project_service_compute"],
  });

  return getPrettyJSONString(resource);
}
